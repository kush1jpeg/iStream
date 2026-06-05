import { redisClient } from "./config/redis.js";

export async function verifyStreamKey(streamKey) {
  const streamId = await redisClient.get(`streamKey:${streamKey}`);
  const streamData = await redisClient.hgetall(`stream:${streamId}`);

  if (!streamData || streamData.status === "ended") {
    console.log(`stream data missing for streamId: ${streamId} || streamEnded`);
    publishStreamLog(
      `stream data missing for streamId: ${streamId} || streamEnded`,
      streamKey,
      "err",
    );

    return false;
  }
  if (streamData.status === "pending" || streamData.status === "inactive") {
    await redisClient.hset(`stream:${streamId}`, "status", "live");
    // Heartbeat refresh
    await redisClient.expire(`streamKey:${streamKey}`, 15);
    publishStreamLog(
      `streamKey verified, stream:${streamId} set to live`,
      streamKey,
      "info",
    );
    console.log(`streamKey verified, stream:${streamId} set to live`);
  }

  return true;
}

export async function publishStreamLog(msg, streamKey, type) {
  const streamId = await redis.get(`streamKey:${streamKey}`);
  if (!streamId) {
    logger.warn(`[stream:log] no streamId found for ${streamKey}`);
    return;
  }

  const streamData = await redis.hgetall(`stream:${streamId}`);
  if (!streamData?.streamer) {
    logger.warn(`[stream:log] no streamer data for ${streamId}`);
    return;
  }

  const { id: userId } = JSON.parse(streamData.streamer);
  const data = {
    type: "stream",
    msg,
    userId,
    streamId,
    createdAt: Date.now(),
  };

  if (type === "info") logger.info(msg);
  else logger.error(msg);

  await redis.publish("stream:log", JSON.stringify(data));
}
