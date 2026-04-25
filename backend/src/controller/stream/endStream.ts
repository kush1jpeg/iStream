import type { Request, Response } from "express";
import { streamModel } from "../../models/stream";
import { redis } from "../../config/redis";

export const endStream = async (req: Request, res: Response) => {
  const { streamId } = req.params;
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
      .json({ success: false, message: "Unauthorized personnel" });
  }
  if (stream.status !== "live") {
    return res
      .status(400)
      .json({ success: false, message: "Stream is not live" });
  }

  const redisStream = await redis.hgetall(`stream:${streamId}`);

  stream.status = "ended";
  stream.endedAt = new Date();
  stream.viewers = Number(redisStream?.viewers) || 0;
  stream.views = Number(redisStream?.views) || 0;
  await stream.save();

  // cleanup redis
  const pipeline = redis.multi();
  pipeline.del(`stream:${streamId}`);
  pipeline.del(`live:user:${userId}`);
  pipeline.srem(`live:streams`, streamId);
  pipeline.del(`streamKey:${stream.streamKeyHash}`);
  await pipeline.exec();

  return res.status(200).json({ success: true, message: "Stream ended" });
};
