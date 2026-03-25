import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";
import Docker from "dockerode";

export const redis = new Redis({
  host: "redis",
  port: 6379,
});

export const docker = new Docker({
  socketPath: "/var/run/docker.sock",
});

import { deleteWorker, spawnWorker } from "./helpers.js";

const MAX_WORKERS = Number(process.env.MAX_WORKERS);
const MIN_WORKER = Number(process.env.MIN_WORKERS);
const WAIT_TIME = Number(process.env.WAIT_TIME);
const RTMP_URL = process.env.RTMP_URL;
const IMAGE = process.env.IMAGE;
const REDIS_PORT = process.env.REDIS_PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NETWORK = process.env.NETWORK;

console.log("[+] deleting the previous workers");
await redis.del("workers");
for (let i = 0; i < MIN_WORKER; i++) {
  try {
    await spawnWorker(
      IMAGE,
      "stream.jobs",
      RTMP_URL,
      REDIS_PORT,
      RABBITMQ_URL,
      NETWORK,
    );
  } catch (err) {
    console.error("Autoscaler failed:", err);
  }
}

let idleTimer = null;
async function autoscaler() {
  try {
    const allWorkers = await redis.hgetall("workers");
    console.log("[+] allWorkers", allWorkers);
    const busyCount = Object.values(allWorkers).filter(
      (state) => state === "busy",
    ).length;
    console.log("[+]busyCount ", busyCount);

    const idleCount = Object.values(allWorkers).filter(
      (state) => state === "idle",
    ).length;

    console.log("[+] idle", idleCount);
    const total = busyCount + idleCount;

    if (busyCount == total && total < MAX_WORKERS) {
      await spawnWorker(
        IMAGE,
        "stream.jobs",
        REDIS_NAME,
        RTMP_URL,
        REDIS_PORT,
        RABBITMQ_URL,
        NETWORK,
      );
    } else if (idleCount > 0 && total > MIN_WORKER) {
      if (!idleTimer) {
        idleTimer = setTimeout(async () => {
          // deleteWorker here
          await deleteWorker();
          idleTimer = null;
        }, WAIT_TIME);
      }
    } else {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  } catch (err) {
    console.error("Autoscaler failed:", err);
  }
}

setInterval(autoscaler, 4000);

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
