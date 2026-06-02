import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import {
  IStreamerRedisData,
  IStreamRedis,
  IStreamRedisData,
  IStreamRedisFrontend,
} from "../../types/types";

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

  const final = streams.map((raw) => {
    const data = raw as IStreamRedis;
    const streamData: IStreamRedisFrontend = {
      streamer: JSON.parse(data.streamer) as IStreamerRedisData,
      stream: JSON.parse(data.stream) as IStreamRedisData,
      streamerId: data.streamerId,
      streamId: data.streamId,
      HLS_PATH: data.HLS_PATH,
      inactiveSince: data.inactiveSince,
      status: data.status,
      viewers: data.viewers,
      likes: data.likes,
      views: data.views,
      createdAt: data.createdAt,
    };
    return streamData;
  });

  console.log("finalData - ", final);
  return res.status(200).json({
    streams: final,
    hasMore,
    nextCursor: hasMore ? cursor + limit : null,
  });
};
