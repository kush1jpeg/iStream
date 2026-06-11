import { redisClient } from "./config/redis.js";
import { checkStreamLoadStatus } from "./controllers/checkStreamLoadStatus.js";

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
    // checking if the server can handle any more streams!
    if (streamData.status === "pending") {
      const result = checkStreamLoadStatus(streamKey);
      if (!result.allowed) {
        publishStreamLog(
          "Stream rejected - server at capacity. Try again in a few minutes.",
          streamKey,
          "err",
        );
        sendToNotify(streamData.streamerId);
      }
      return false;
    }
    await redisClient.hset(`stream:${streamId}`, "status", "live");
    // Heartbeat refresh
    await redisClient.expire(`streamKey:${streamKey}`, 15);
    publishStreamLog(
      streamData.status === "pending"
        ? `OBS connected, stream:${streamId} set to live`
        : `streamKey verified, stream:${streamId} set to live`,
      streamKey,
      "info",
    );
    console.log(`streamKey verified, stream:${streamId} set to live`);
  }

  return true;
}

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

  const userId = JSON.parse(streamData.streamerId);
  const data = {
    type: "stream",
    msg,
    userId,
    streamId,
    createdAt: Date.now(),
  };

  if (type === "info") console.log(msg);
  else console.error(msg);

  await redisClient.publish(`stream:log${userId}`, JSON.stringify(data));
}

async function sendToNotify(userId) {
  const buffer = {
    type: "stream",
    userId,
    createdAt: Date.now(),
  };
  await redisClient.publish(`notifications:${userId}`, buffer);
}
