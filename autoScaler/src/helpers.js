import { getPublishChannel } from "./helper/connectRabbitMq.js";
import { docker, redis } from "./index.js";

const logsDir = process.env.LOGS_DIR;
console.log("[+] logsDir:", logsDir);

export async function spawnWorker(
  IMAGE,
  QUEUE_NAME,
  RTMP_URL,
  REDIS_PORT,
  RABBITMQ_URL,
  NETWORK,
) {
  const ID = `worker-${crypto.randomUUID()}`;
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
      NetworkMode: `${NETWORK}`, // SAME docker network {docker assings a prefix to each network name which i did override from compose to make this work}
      RestartPolicy: { Name: "no" },
      Binds: [
        `${logsDir}:/var/log/`, // volume for logs of each worker
        `hls_data:/hls`,
      ],
    },
  });

  await container.start();
  await redis.hset("workers", container.id.slice(0, 12), "idle");

  console.log("[+] Spawned worker:", container.id);
}

export async function deleteWorker() {
  const workers = await redis.hgetall("workers");
  for (const [containerID, status] of Object.entries(workers)) {
    if (status === "idle" || status == "dead") {
      await redis.hdel("workers", containerID);
      const c = docker.getContainer(containerID);
      await c.stop().catch(() => {}); // ignore if already stopped
      await c.remove({ force: true });
    }
  }
}

export async function terminateStream(streamId, userId) {
  const channel = await getPublishChannel();
  channel.publish(
    "stream",
    "stream.end",
    Buffer.from(JSON.stringify({ streamId, userId })),
    { persistent: true },
  );
}

export const gracefulShutdown = async (signal) => {
  console.log(`\n💀 Received ${signal}. Shutting down gracefully...`);
  try {
    // close Redis
    await redis.quit();
    console.log("✅ Redis disconnected");

    const workers = await redis.hgetall("workers");
    await Promise.all(
      Object.keys(workers).map((id) =>
        docker
          .getContainer(id)
          .remove({ force: true })
          .catch(() => {}),
      ),
    );

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
