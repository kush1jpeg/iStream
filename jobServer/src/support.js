import { redisClient } from "./config/redis.js";

export async function verifyStreamKey(streamKey) {
  const streamId = await redisClient.get(`streamKey:${streamKey}`);
  if (!streamId) {
    console.log(`streamKey NOT found: ${streamKey}`);
    return false;
  }

  const streamData = await redisClient.hgetall(`stream:${streamId}`);
  if (!streamData || streamData.status == "ended") {
    console.log(`stream data missing for streamId: ${streamId} || streamEnded`);
    return false;
  }

  if (streamData == "inactive") {
    await redisClient.hset(`stream:${streamId}`, "status", "live");
    console.log(`streamKey verified, stream:${streamId} set to live`);
  }
  return true;
}
