import { getChannel } from "../config/rabbitmq.js";
import { redisClient } from "../config/redis.js";

const MAX_CONCURRENT_STREAMS = process.env.MAX_CONCURRENT_STREAMS || 4;

export async function checkStreamLoadStatus(streamKey) {
  const activeCount = await redisClient.scard("live:streams");

  if (activeCount >= MAX_CONCURRENT_STREAMS) {
    console.warn(
      `[admission] rejected for - ${streamKey} —> ${activeCount} streams active`,
    );
    const streamId = await redisClient.get(`streamKey:${streamKey}`);
    const userId = await redisClient.hget(`stream:${streamId}`, "streamerId");
    pushToTerminateStream(streamId, userId);
    return { allowed: false };
  }
  return { allowed: true };
}

async function pushToTerminateStream(streamId, userId) {
  const channel = await getChannel();
  console.log("[*] publishing to stream_end queue for stream:", {
    streamId,
    userId,
  });
  channel.publish(
    "stream",
    "stream.end",
    Buffer.from(JSON.stringify({ streamId, userId })),
    { persistent: true },
  );
}
