import dotenv from "dotenv";
dotenv.config();

import { spawn } from "child_process";
import amqp from "amqplib";
import Redis from "ioredis";
import Docker from "dockerode";
import os from "os";

export const docker = new Docker({
  socketPath: "/var/run/docker.sock",
});

const redis = new Redis({
  host: "redis",
  port: Number(process.env.REDIS_PORT),
});

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RTMP_URL = process.env.RTMP_URL;
const QUEUE_NAME = process.env.QUEUE_NAME;

let busy = false;
let connection;
let channel;

async function startWorker() {
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  if (!channel || !connection) {
    return console.error("worker start error [+] channel|connection error");
  }
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  channel.prefetch(1); // only one job at a time

  console.log("[*] Waiting for jobs...");

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const MTX_PATH = JSON.parse(msg.content.toString());

      console.log(`[x] Received job for stream ${MTX_PATH.split("/")[1]}`);
      busy = true;

      // Build ffmpeg command
      const ffmpegArgs = [
        "-i",
        `${RTMP_URL}/${MTX_PATH}`,
        "-map",
        "v:0",
        "-map",
        "a:0",
        "-s:v:0",
        "1920x1080",
        "-b:v:0",
        "6000k",
        "-map",
        "v:0",
        "-map",
        "a:0",
        "-s:v:1",
        "1280x720",
        "-b:v:1",
        "3000k",
        "-map",
        "v:0",
        "-map",
        "a:0",
        "-s:v:2",
        "854x480",
        "-b:v:2",
        "1200k",
        "-var_stream_map",
        "v:0,a:0 v:1,a:1 v:2,a:2",
        "-hls_time",
        "4",
        "-hls_list_size",
        "8",
        "-master_pl_name",
        "master.m3u8",
        `${MTX_PATH}/v%v/index.m3u8`,
      ];

      const containerID = os.hostname(); // or /proc/self/cgroup
      const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, { stdio: "inherit" });
      await redis.hset("workers", containerID, "busy");

      ffmpegProcess.on("close", async (code) => {
        console.log(
          `[x] Stream  ${MTX_PATH.split("/")[1]} finished with code ${code}`,
        );
        if (busy) {
          await redis.hset("workers", containerID, "idle");
          busy = false;
        }
        channel.ack(msg); // job done
      });

      ffmpegProcess.on("SIGINT", () => handle("SIGINT", containerID));
      ffmpegProcess.on("SIGTERM", () => handle("SIGTERM", containerID));

      ffmpegProcess.on("error", (err) => {
        console.error(
          `[!] ffmpeg error for stream  ${MTX_PATH.split("/")[1]}:`,
          err,
        );
        channel.nack(msg); // requeue
      });
    },
    { noAck: false },
  );
}

startWorker().catch(console.error);

async function handle(signal, containerID) {
  console.log(`[!] Worker shutting down (${signal})`);

  try {
    if (busy) {
      console.log("[!] Cleaning up busy state");
      await redis.hset("workers", containerID, "idle");
      busy = false;
    }

    await channel?.close();
    await connection?.close();
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    process.exit(0);
  }
}
