import { redisClient } from "../config/redis.js";
import { checkStreamLoadStatus } from "../controllers/checkStreamLoadStatus.js";
import { publishStreamLog } from "./publishStreamLogs.js";

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
      const result = await checkStreamLoadStatus(
        streamKey,
        streamId,
        streamData.streamerId,
      );
      if (!result.allowed) {
        publishStreamLog(
          "Stream rejected - server at capacity. Try again in a few minutes.",
          streamKey,
          "err",
        );
        sendToNotify(
          streamData.streamerId,
          "server at capacity. Try again in a few minutes.",
        );
        return false;
      }
    }
    // Heartbeat refresh
    // if server dies ->  key auto-expires after 15sec ->  marks it as inactive -> queue clears it
    await redisClient.expire(`streamKey:${streamKey}`, 15);
    await redisClient.hset(`stream:${streamId}`, { status: "live" });

    publishStreamLog(
      streamData.status === "pending"
        ? `OBS connected, stream:${streamId} set to live`
        : `streamKey verified, stream:${streamId} set to live`,
      streamKey,
      "info",
    );
    console.log(`streamKey verified, stream:${streamId} set to live`);
    return true;
  }
  if (streamData.status === "live") {
    await redisClient.expire(`streamKey:${streamKey}`, 15);
    console.log(`streamKey verified, stream:${streamId} set remains live`);
    return true;
  }
  return false;
}

async function sendToNotify(userId, msg) {
  const buffer = {
    type: "stream",
    msg,
    userId,
    createdAt: Date.now(),
  };
  await redisClient.publish(`notifications:${userId}`, JSON.stringify(buffer));
}
