import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import { spawn } from "child_process";
import Docker from "dockerode";
import os from "os";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { redis, redisConnect } from "./config/redis.js";
import { handleTerm } from "./config/termHandler.js";
import { ffmpegStreaming } from "./ffmpeg/streaming.js"; // for streaming only
import { ffmpegStreamingVod } from "./ffmpeg/vod+streaming.js";

import pino from "pino";
import { drainUploadQueue } from "./cloudflare/drainUpload.js";
import { startUploadConsumer } from "./cloudflare/consumer.js";
import { initWatcher } from "./watcher/watcher.js";
export const logger = pino(pino.destination(`/var/log/${os.hostname()}.log`));
logger.info(`worker created ${os.hostname()}`);

export const docker = new Docker({
  socketPath: "/var/run/docker.sock",
});

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RTMP_URL = process.env.RTMP_URL;
const QUEUE_NAME = process.env.QUEUE_NAME;

let busy = false;

logger.info(
  {
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    REDIS_PORT: process.env.REDIS_PORT,
    QUEUE_NAME: process.env.QUEUE_NAME,
    RTMP_URL: process.env.RTMP_URL,
  },
  "env check",
);

async function startWorker() {
  await redisConnect();
  const channel = await connectRabbitMQ(RABBITMQ_URL, QUEUE_NAME);
  channel.prefetch(1); // only one job at a time
  logger.info("[*] Waiting for jobs...");

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const MTX_PATH = JSON.parse(msg.content.toString());
      const watcher = await initWatcher(MTX_PATH);
      if (!watcher)
        logger.info(`[!] ffmpeg error for stream  ${MTX_PATH.split("/")[1]}:`);
      await startUploadConsumer(MTX_PATH);

      logger.info(`[+] Received job for stream ${MTX_PATH.split("/")[1]}`);
      busy = true;

      const containerID = os.hostname(); // or /proc/self/cgroup

      const ffmpegProcess = spawn(
        "ffmpeg",
        ffmpegStreamingVod(RTMP_URL, MTX_PATH), // change it to ffmpegStreaming for without VOD;
        {
          stdio: "inherit",
        },
      );
      await redis.hset("workers", containerID, "busy");

      ffmpegProcess.on("close", async (code) => {
        logger.info(
          `[x] Stream  ${MTX_PATH.split("/")[1]} finished with code ${code}`,
        );

        // stop watching
        await watcher.close();

        // mark uploading
        await redis.hset("workers", containerID, "uploading");

        // drain the upload queue
        await drainUploadQueue(MTX_PATH);

        // cleanup local files
        fs.rmSync(`/hls/live/${MTX_PATH}`, { recursive: true, force: true });

        channel.ack(msg); // job done
      });

      ffmpegProcess.on("error", (err) => {
        logger.info(
          `[!] ffmpeg error for stream  ${MTX_PATH.split("/")[1]}:`,
          err,
        );
        channel.nack(msg); // requeue
      });
    },
    { noAck: false },
  );
}

startWorker().catch((err) =>
  logger.error("[!] Starting of worker failed", err),
);

process.on("SIGINT", () => handleTerm("SIGINT", os.hostname(), busy));
process.on("SIGTERM", () => handleTerm("SIGTERM", os.hostname(), busy));
