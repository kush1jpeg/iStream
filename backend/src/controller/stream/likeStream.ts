import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import { streamModel } from "../../models/stream";

export const likeStream = async (req: Request, res: Response) => {
  const { streamId } = req.params;
  const userId = req.id;

  const added = await redis.sadd(`stream:likes:${streamId}`, userId!);
  if (added === 0) {
    // already liked so unlike;
    await redis.srem(`stream:likes:${streamId}`, userId!);
    await redis.hincrby(`stream:${streamId}`, "likes", -1);
    return res.status(200).json({ liked: false });
  }

  await redis.hincrby(`stream:${streamId}`, "likes", 1);
  return res.status(200).json({ liked: true });
};

setInterval(async () => {
  const streamIds = await redis.smembers("live:streams");
  if (!streamIds.length) return;

  const pipeline = redis.pipeline();
  streamIds.forEach((id) => pipeline.hget(`stream:${id}`, "likes"));
  const results = await pipeline.exec();

  const bulkOps = streamIds.map((id, i) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { like: Number(results![i][1]) || 0 } },
    },
  }));

  if (bulkOps.length) await streamModel.bulkWrite(bulkOps);
}, 10000);
