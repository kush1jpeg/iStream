import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import { streamModel } from "../../models/stream";

export const startStream = async (req: Request, res: Response) => {
  const [streamId, streamKey] = req.body;
  if (!streamId) {
    return res
      .status(400)
      .json({ success: false, message: "Stream ID required" });
  }

  const userId = req.id;
  const stream = await streamModel.findById(streamId);

  if (!stream) {
    return res
      .status(404)
      .json({ success: false, message: "Stream not found" });
  }
  if (stream.streamerId.toString() !== userId) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized User access" });
  }

  stream.status = "live";
  stream.expiresAt = null;
  stream.startedAt = new Date();
  await stream.save();

  // streamer: as the stream starts create redis stream details;
  const redisData = {
    streamerId: userId,
    thumbnail: stream.thumbnail,
    streamKey: streamKey,
    createdAt: new Date().toISOString(),
    viewers: "0", // store as string
    views: "0",
  };

  const pipeline = redis.multi();
  pipeline.hset(`stream:${streamId}`, redisData);
  pipeline.set(`live:user:${userId}`, streamId);

  // for MediaMTX auth
  pipeline.set(`streamKey:${streamKey}`, streamId);

  await pipeline.exec();
};
