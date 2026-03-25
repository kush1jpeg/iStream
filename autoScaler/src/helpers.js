import { docker, redis } from "./index.js";

export async function spawnWorker(
  IMAGE,
  QUEUE_NAME,
  RTMP_URL,
  REDIS_PORT,
  RABBITMQ_URL,
  NETWORK,
) {
  const ID = `worker-${crypto.randomUUID()}`;
  await redis.hset("workers", ID, "idle");
  const container = await docker.createContainer({
    Image: IMAGE,
    name: `${ID}`,
    Env: [
      `RABBITMQ_URL=${RABBITMQ_URL}`,
      `QUEUE_NAME=${QUEUE_NAME}`,
      `RTMP_URL=${RTMP_URL}`,
      `REDIS_PORT=${REDIS_PORT}`,
    ],
    Labels: {
      role: "ffmpeg-worker",
    },
    HostConfig: {
      NetworkMode: `${NETWORK}`, // SAME docker network {docker assings a prefix to each network name which i did override from compose}
      RestartPolicy: { Name: "no" },
    },
  });

  await container.start();

  console.log("[+] Spawned worker:", ID);
}

export async function deleteWorker() {
  const workers = await redis.hgetall("workers");
  for (const [containerID, status] of Object.entries(workers)) {
    if (status === "idle") {
      await redis.hdel("workers", containerID);
      const c = docker.getContainer(containerID);
      await c.stop().catch(() => {}); // ignore if already stopped
      await c.remove({ force: true });
    }
  }
}

export const gracefulShutdown = async (signal) => {
  console.log(`\n💀 Received ${signal}. Shutting down gracefully...`);
  try {
    console.log("[+] deleting the previous workers");

    // clearing the workers from redis and server
    const allWorkers = await redis.hgetall("workers");
    await Promise.all(Object.keys(allWorkers).map((e) => deleteWorker(e)));

    console.log("✅ All workers deleted");

    // close Redis
    await redis.quit();
    console.log("✅ Redis disconnected");

    // fallback in case server.close hangs
    setTimeout(() => {
      console.warn("⚠️ Force exit after 5s");
      process.exit(1);
    }, 5000);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};
