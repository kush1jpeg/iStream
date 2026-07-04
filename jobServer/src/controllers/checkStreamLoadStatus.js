import { redisClient } from "../config/redis.js";
import { pushToTerminateStream } from "../helpers/pushToTerminate.js";

const MAX_CONCURRENT_STREAMS = process.env.MAX_CONCURRENT_STREAMS || 4;

export async function checkStreamLoadStatus(streamKey, streamId, userId) {
  const activeCount = await redisClient.scard("live:streams");
  console.log(
    `[admission] checking stream load —> ${activeCount} streams active`,
  );

  if (activeCount >= MAX_CONCURRENT_STREAMS) {
    // intentionally keeping the allowed Count = MAX_CONCURRENT_STREAMS -1; to be safe;
    console.warn(
      `[admission] rejected for - ${streamKey} —> ${activeCount} streams active`,
    );
    pushToTerminateStream(streamId, userId);
    return { allowed: false };
  }
  return { allowed: true };
}
