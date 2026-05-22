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
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId required" });
  }

  try {
    await terminateStream(streamId, userId);
    return res.status(200).json({ success: true, message: "Stream ended" });
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      "Stream not found": 404,
      Unauthorized: 403,
      "Stream is not live": 400,
    };
    return res
      .status(statusMap[err.message] || 500)
      .json({ success: false, message: err.message });
  }
};

export const terminateStream = async (streamId: string, userId: string) => {
  const stream = await streamModel.findById(streamId);

  if (!stream) throw new Error("Stream not found");
  if (stream.streamerId.toString() !== userId) throw new Error("Unauthorized");
  if (stream.status !== "live") throw new Error("Stream is not live");

  const redisStream = await redis.hgetall(`stream:${streamId}`);

  stream.status = "ended";
  stream.endedAt = new Date();
  stream.viewers = Number(redisStream?.viewers) || 0;
  stream.views = Number(redisStream?.views) || 0;
  stream.VOD_URL = `${process.env.R2_PUBLIC_URL}/hls/live/${stream.streamKey}/master.m3u8`;
  await stream.save();

  const pipeline = redis.multi();
  pipeline.del(`stream:${streamId}`);
  pipeline.del(`live:user:${userId}`);
  pipeline.srem(`live:streams`, streamId);
  pipeline.del(`streamKey:${stream.streamKey}`);
  await pipeline.exec();
};
