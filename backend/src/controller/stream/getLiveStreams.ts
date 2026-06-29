import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import {
  IStreamerRedisData,
  IStreamRedis,
  IStreamRedisData,
  IStreamRedisFrontend,
} from "@istream/shared";

export const getAvailableLiveStreams = async (req: Request, res: Response) => {
  const limit = 20;
  const cursor = Number(req.query.cursor) || 0; // offset into the set
  try {
    const data = await getLiveStreams(cursor, limit);
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
  }
};

export async function getLiveStreams(cursor: number, limit: number) {
  const allStreamIds = await redis.smembers("live:streams");
  const paginated = allStreamIds.slice(cursor, cursor + limit);
  const hasMore = cursor + limit < allStreamIds.length;

  if (paginated.length === 0)
    return { streams: [], hasMore: false, nextCursor: null };

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
      streamKey: data.streamKey,
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
  return {
    streams: final,
    hasMore,
    nextCursor: hasMore ? cursor + limit : null,
  };
}
