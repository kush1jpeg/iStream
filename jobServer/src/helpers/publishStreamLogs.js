import { redisClient } from "../config/redis.js";

export async function publishStreamLog(msg, streamKey, type) {
  const streamId = await redisClient.get(`streamKey:${streamKey}`);
  if (!streamId) {
    console.warn(`[stream:log] no streamId found for ${streamKey}`);
    return;
  }

  const streamData = await redisClient.hgetall(`stream:${streamId}`);
  if (!streamData?.streamer) {
    console.warn(`[stream:log] no streamer data for ${streamId}`);
    return;
  }

  const userId = streamData.streamerId;
  const data = {
    type: "stream",
    msg,
    userId,
    streamId,
    createdAt: Date.now(),
  };

  if (type === "info") console.log(msg);
  else console.error(msg);

  await redisClient.publish(`stream:log:${userId}`, JSON.stringify(data));
}
