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
import { initWatcher, publishStreamLog } from "./watcher/watcher.js";
import { setInterval } from "timers";
export const logger = pino(pino.destination(`/var/log/${os.hostname()}.log`));
logger.info(`worker created ${os.hostname()}`);

export const docker = new Docker({
  socketPath: "/var/run/docker.sock",
});

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RTMP_URL = process.env.RTMP_URL;
const QUEUE_NAME = process.env.QUEUE_NAME;

let busy = false;

const containerID = os.hostname(); // or /proc/self/cgroup

async function startWorker() {
  await redisConnect();
  const channel = await connectRabbitMQ(RABBITMQ_URL, QUEUE_NAME);
  channel.prefetch(1); // only one job at a time
  logger.info("[*] Waiting for jobs...");

  // setting up ttl for heartbeat to autoscaler;
  setInterval(async () => {
    await redis.set(`worker:heartbeat:${containerID}`, Date.now().toString());
  }, 3000);

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const MTX_PATH = JSON.parse(msg.content.toString());
      const watcher = await initWatcher(MTX_PATH);
      if (!watcher)
        logger.info(`[!] ffmpeg error for stream  ${MTX_PATH.split("/")[1]}:`);

      // no await here cuz this runs concurrently;
      logger.info("[+] starting the upload consume concurrently");
      startUploadConsumer(MTX_PATH);

      await publishStreamLog(
        `[+] Received job for stream ${MTX_PATH.split("/")[1]}`,
        MTX_PATH,
        "info",
      );
      busy = true;

      const ffmpegProcess = spawn(
        "ffmpeg",
        ffmpegStreamingVod(RTMP_URL, MTX_PATH.split("/")[1]), // change the func call to ffmpegStreaming for without VOD;
        {
          stdio: "inherit",
        },
      );
      await redis.hset("workers", containerID, "busy");

      ffmpegProcess.on("close", async (code) => {
        await publishStreamLog(
          `[x] Stream  ${MTX_PATH.split("/")[1]} finished with code ${code}`,
          MTX_PATH,
          "info",
        );

        // stop watching
        await watcher.close();

        // drain the upload queue
        await drainUploadQueue(MTX_PATH);

        // cleanup local files
        fs.rmSync(`/hls/${MTX_PATH}`, { recursive: true, force: true });
        await publishStreamLog(
          `[VOD] cleaned up ${MTX_PATH}`,
          MTX_PATH,
          "info",
        );

        await redis.hset("workers", containerID, "idle");
        busy = false;
        await publishStreamLog(
          `[SUCCESS] Stream Uploaded to Cloudflare-R2 : ${MTX_PATH}`,
          MTX_PATH,
          "info",
        );

        channel.ack(msg); // job done
      });

      ffmpegProcess.on("error", async (err) => {
        await publishStreamLog(
          `[!] ffmpeg error for stream - ${MTX_PATH.split("/")[1]}: ${err}`,
          MTX_PATH,
          "err",
        );
        logger.info(err);
        channel.nack(msg); // requeue
      });
    },
    { noAck: false },
  );
}

startWorker().catch((err) =>
  publishStreamLog(`[!] Starting of worker failed ${err}`, MTX_PATH, "info"),
);

process.on("SIGINT", () => handleTerm("SIGINT", os.hostname(), busy));
process.on("SIGTERM", () => handleTerm("SIGTERM", os.hostname(), busy));
