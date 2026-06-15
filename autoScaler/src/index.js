import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";
import Docker from "dockerode";

export const redis = new Redis({ host: "redis", port: 6379 });

export const docker = new Docker({
  socketPath: "/var/run/docker.sock",
});

import { deleteWorker, gracefulShutdown, spawnWorker } from "./helpers.js";
import { connectToRabbitMQ } from "./config/connectRabbitMq.js";

const MAX_WORKERS = Number(process.env.MAX_WORKERS);
const MIN_WORKERS = Number(process.env.MIN_WORKERS);
const WAIT_TIME = Number(process.env.WAIT_TIME);
const RTMP_URL = process.env.RTMP_URL;
const IMAGE = process.env.IMAGE;
const REDIS_PORT = process.env.REDIS_PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NETWORK = process.env.NETWORK;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEYID = process.env.R2_ACCESS_KEYID;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

for (let i = 0; i < MIN_WORKERS; i++) {
  try {
    await spawnWorker(
      IMAGE,
      "stream.jobs",
      RTMP_URL,
      REDIS_PORT,
      RABBITMQ_URL,
      NETWORK,
      R2_BUCKET,
      R2_ENDPOINT,
      R2_SECRET_KEY,
      R2_PUBLIC_URL,
      R2_ACCESS_KEYID,
    );
  } catch (err) {
    console.error("Autoscaler failed:", err);
  }
}

let idleTimer = null;
async function autoscaler() {
  try {
    const allWorkers = await redis.hgetall("workers");

    // check heartbeats, remove dead workers
    for (const [containerId, state] of Object.entries(allWorkers)) {
      const heartbeat = await redis.ttl(`worker:heartbeat:${containerId}`);
      if (heartbeat === -2) {
        console.log(`[!] ${containerId} heartbeat expired, removing`);
        await redis.hdel("workers", containerId);
        await docker
          .getContainer(containerId)
          .remove({ force: true })
          .catch(() => {});
        delete allWorkers[containerId];
      }
    }
    console.log("[+] allWorkers", allWorkers);
    const busyCount = Object.values(allWorkers).filter(
      (state) => state === "busy",
    ).length;
    console.log("[+] busy ", busyCount);

    const idleCount = Object.values(allWorkers).filter(
      (state) => state === "idle",
    ).length;

    console.log("[+] idle", idleCount);
    const total = busyCount + idleCount;

    if (busyCount == total && total < MAX_WORKERS) {
      await spawnWorker(
        IMAGE,
        "stream.jobs",
        RTMP_URL,
        REDIS_PORT,
        RABBITMQ_URL,
        NETWORK,
        R2_BUCKET,
        R2_ENDPOINT,
        R2_SECRET_KEY,
        R2_PUBLIC_URL,
        R2_ACCESS_KEYID,
      );
    } else if (idleCount > 0 && total > MIN_WORKERS) {
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

await connectToRabbitMQ();
const autoScalerTimer = setInterval(autoscaler, 5000);

process.on("SIGINT", async () => {
  clearInterval(autoScalerTimer);
  await gracefulShutdown("SIGINT");
});
process.on("SIGTERM", async () => {
  clearInterval(autoScalerTimer);
  await gracefulShutdown("SIGTERM");
});
