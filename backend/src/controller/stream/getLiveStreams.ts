import type { Request, Response } from "express";
import { redis } from "../../config/redis";

export const getLiveStreams = async (req: Request, res: Response) => {
  const streamIds = await redis.smembers("live:streams");
  if (streamIds.length === 0) return res.status(201).json({ streams: [] });

  const pipeline = redis.pipeline();
  streamIds.forEach((streamId) => pipeline.hgetall(`stream:${streamId}`));
  const results = await pipeline.exec();

  // pipeline.exec() returns an array of [error, result]
  return res.status(201).json({
    streams: results
      ? results.map(([err, data]) => (err ? null : data)).filter(Boolean)
      : [],
  });
};
