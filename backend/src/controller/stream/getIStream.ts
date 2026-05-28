import type { Request, Response } from "express";
import { redis } from "../../config/redis";

export const getIStream = async (req: Request, res: Response) => {
  const streamId = req.params.streamId;
  const streamDetails = await redis.hgetall(`stream:${streamId}`);
  console.log("streamDetails-", streamDetails);
  return res.status(201).json({ stream: streamDetails });
};
