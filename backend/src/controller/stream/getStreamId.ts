import { redis } from "../../config/redis";
import type { Request, Response } from "express";

export const getStreamId = async (req: Request, res: Response) => {
  const { Id } = req.query;
  const stream = await redis.get(`live:user:${Id}`);

  res.json({
    streamId: stream,
  });
};
