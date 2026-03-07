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
const REDIS_NAME = process.env.REDIS_NAME;
const RTMP_URL = process.env.RTMP_URL;
const IMAGE = process.env.IMAGE;
const REDIS_PORT = process.env.REDIS_PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NETWORK = process.env.NETWORK;

let idleTimer = null;

for (let i = 0; i < MIN_WORKER; i++) {
  spawnWorker();
}

async function autoscaler() {
  const allWorkers = await redis.hgetall("workers");
  const busyCount = Object.values(allWorkers).filter(
    (state) => state === "busy",
  ).length;
  const idleCount = Object.values(allWorkers).filter(
    (state) => state === "idle",
  ).length;
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

  console.log("The no of workers are [+] ", workers.length);
}

setInterval(autoscaler, 4000);
