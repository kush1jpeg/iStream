import { redisClient } from "./config/redis.js";

export async function verifyStreamKey(streamKey) {
  const streamId = await redisClient.get(`streamKey:${streamKey}`);
  if (!streamId) {
    console.log(`streamKey NOT found: ${streamKey}`);
    return false;
  }
  const userId = await redisClient.get(`live:user:${streamId}`);
  if (!userId) {
    console.log(`no userId mapped to streamId: ${streamId}`);
    return false;
  }

  // 3. get stream data
  const streamData = await redisClient.hgetall(`stream:${streamId}`);
  if (!streamData || streamData.status === "ended") {
    console.log(`stream data missing or ended for streamId: ${streamId}`);
    return false;
  }

  // 4. activate if pending/inactive
  if (streamData.status === "pending" || streamData.status === "inactive") {
    await redisClient.hset(`stream:${streamId}`, "status", "live");
    // refresh heartbeat so handleInactive doesn't immediately kill it
    await redisClient.set(`streamKey:${streamKey}`, streamId, "EX", 15);
    console.log(`streamKey verified, stream:${streamId} set to live`);
  }

  return true;
}
