import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import { IStreamRedisFrontend } from "../../types/types";

export const getIStream = async (req: Request, res: Response) => {
  const streamId = req.params.streamId;
  const data = await redis.hgetall(`stream:${streamId}`);

  const streamData: IStreamRedisFrontend = {
    streamer: JSON.parse(data.streamer),
    stream: JSON.parse(data.stream),
    streamerId: data.streamerId,
    streamId: data.streamId,
    HLS_PATH: data.HLS_PATH,
    inactiveSince: data.inactiveSince,
    status: data.status as "live" | "pending" | "ended" | "inactive",
    viewers: data.viewers,
    likes: data.likes,
    views: data.views,
    createdAt: data.createdAt,
  };

  console.log("streamDetails-", streamData);
  return res.status(201).json({ stream: streamData });
};
