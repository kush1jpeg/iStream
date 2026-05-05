import type { Request, Response } from "express";
import { redis } from "../../config/redis";

export const getLiveStreams = async (req: Request, res: Response) => {
  const limit = 20;
  const cursor = Number(req.query.cursor) || 0; // offset into the set

  const allStreamIds = await redis.smembers("live:streams");
  const paginated = allStreamIds.slice(cursor, cursor + limit);
  const hasMore = cursor + limit < allStreamIds.length;

  if (paginated.length === 0)
    return res
      .status(200)
      .json({ streams: [], hasMore: false, nextCursor: null });

  const pipeline = redis.pipeline();
  paginated.forEach((id) => pipeline.hgetall(`stream:${id}`));
  const results = await pipeline.exec();

  // pipeline.exec() returns an array of [error, result]
  const streams = results!
    .map(([err, data]) => (err ? null : data))
    .filter(Boolean);

  return res.status(200).json({
    streams,
    hasMore,
    nextCursor: hasMore ? cursor + limit : null,
  });
};
