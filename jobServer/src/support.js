import { redisClient } from "./config/redis.js";

export async function verifyStreamKey(streamKey) {
  const streamId = await redisClient.get(`streamKey:${streamKey}`);

  if (streamId) {
    console.log(`streamKey:${streamKey} verified for stream:${streamId}`);
    return true;
  } else {
    console.log(`streamKey NOT verified or stream not available: ${streamKey}`);
    return false;
  }
}
