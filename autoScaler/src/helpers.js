import { docker, redis } from "./index.js";

export async function spawnWorker(
  IMAGE,
  REDIS_NAME,
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
      `REDIS_NAME=${REDIS_NAME}`,
      `QUEUE_NAME=${QUEUE_NAME}`,
      `RTMP_URL=${RTMP_URL}`,
      `REDIS_PORT=${REDIS_PORT}`,
    ],
    Labels: {
      role: "ffmpeg-worker",
    },
    HostConfig: {
      NetworkMode: `${NETWORK}`, // SAME docker network
      RestartPolicy: { Name: "no" },
    },
  });

  await container.start();

  console.log("[+] Spawned worker:", container);
}

export async function deleteWorker() {
  const workers = await redis.hgetall("workers");
  for (const [containerID, status] of Object.entries(workers)) {
    if (status === "idle") {
      await redis.hdel("workers", containerID);
      const c = docker.getContainer(id);
      await c.stop().catch(() => {}); // ignore if already stopped
      await c.remove({ force: true });
    }
  }
}
