import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";
import Docker from "dockerode";

export const redis = new Redis({ host: "redis", port: 6379 });

export const docker = new Docker({
  socketPath: "/var/run/docker.sock",
});

import {
  deleteWorker,
  gracefulShutdown,
  spawnWorker,
  terminateStream,
} from "./helpers.js";
import { connectToRabbitMQ } from "./helper/connectRabbitMq.js";

const MAX_WORKERS = Number(process.env.MAX_WORKERS);
const MIN_WORKERS = Number(process.env.MIN_WORKERS);
const WAIT_TIME = Number(process.env.WAIT_TIME);
const RTMP_URL = process.env.RTMP_URL;
const IMAGE = process.env.IMAGE;
const REDIS_PORT = process.env.REDIS_PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NETWORK = process.env.NETWORK;

const allWorkers = await redis.hgetall("workers");
if (allWorkers) {
  console.log("[+] deleting the previous workers");
  await Promise.all(
    Object.keys(allWorkers).map((w) => {
      console.log("cleaning prev worker", w);
      return docker
        .getContainer(w)
        .remove({ force: true })
        .catch(() => {}); // move on if container removed can put in trycatch too
    }),
  );
  await redis.del("workers");
}

for (let i = 0; i < MIN_WORKERS; i++) {
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

  // stopping the inactive streams
  const streams = await redis.smembers("live:streams");
  for (const streamId of streams) {
    const data = await redis.hgetall(`stream:${streamId}`);

    if (!data) continue;
    if (data.status === "inactive") {
      const inactiveSince = Number(data.inactiveSince);
      const elapsed = Date.now() - inactiveSince;

      if (elapsed > 60000) {
        // streamer didn't came back after a min
        await terminateStream(streamId);
      }
    }
    //pending streams, OBS never connected
    if (data.status === "pending") {
      const age = Date.now() - new Date(data.createdAt).getTime();
      if (age > 2 * 60000) {
        await terminateStream(streamId);
      }
    }
  }
}

connectToRabbitMQ;
setInterval(autoscaler, 5000);

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
