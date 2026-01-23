import type { Request, Response } from "express";
import { redis } from "../../config/redis";

export const startStream = async (req: Request, res: Response) => {
  // streamer: as the stream starts create redis stream details;
  await redis.hset(`stream:${streamId}`);
};
