import dotenv from "dotenv";
dotenv.config();

import { spawn } from "child_process";
import Docker from "dockerode";
import os from "os";

import pino from "pino";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { redis, redisConnect } from "./config/redis.js";
import { handleTerm } from "./config/termHandler.js";
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

      logger.info(`[+] Received job for stream ${MTX_PATH.split("/")[1]}`);
      busy = true;

      // Build ffmpeg command
      const ffmpegArgs = [
        "-i",
        `${RTMP_URL}/${MTX_PATH}`,

        // 1080p
        "-map",
        "v:0",
        "-map",
        "a:0",
        "-c:v:0",
        "copy",

        // // 720p
        // "-map",
        // "v:0",
        // "-map",
        // "a:0",
        // "-c:v:1",
        // "libx264",
        // "-preset",
        // "veryfast",
        // "-tune",
        // "zerolatency",
        // "-s:v:1",
        // "1280x720",
        // "-b:v:1",
        // "3000k",

        // 480p
        "-map",
        "v:0",
        "-map",
        "a:0",
        "-c:v:2",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "zerolatency",
        "-s:v:2",
        "854x480",
        "-b:v:2",
        "1200k",

        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-f",
        "hls",
        "-hls_time",
        "4",
        "-hls_list_size",
        "6",
        "-hls_flags",
        "delete_segments+append_list",
        "-var_stream_map",
        "v:0,a:0 v:1,a:1", // for just 1080 and 480
        //  "v:0,a:0 v:1,a:1 v:2,a:2", // for 1080,720 and 480
        "-master_pl_name",
        "master.m3u8",
        `/hls/${MTX_PATH}/v%v/index.m3u8`,
      ];

      const containerID = os.hostname(); // or /proc/self/cgroup

      const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, { stdio: "inherit" });
      await redis.hset("workers", containerID, "busy");

      ffmpegProcess.on("close", async (code) => {
        logger.info(
          `[x] Stream  ${MTX_PATH.split("/")[1]} finished with code ${code}`,
        );
        if (busy) {
          await redis.hset("workers", containerID, "idle");
          busy = false;
        }
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
