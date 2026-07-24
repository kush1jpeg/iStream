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
  console.log({
    userId,
    streamerId: stream.streamerId.toString(),
    streamId,
  });
  if (stream.streamerId.toString() !== userId) throw new Error("Unauthorized");
  if (stream.status !== "live") return; // already ended no-op

  const redisStream = await redis.hgetall(`stream:${streamId}`);

  stream.status = "ended";
  stream.endedAt = new Date();
  stream.viewers = Number(redisStream?.viewers) || 0;
  stream.views = Number(redisStream?.views) || 0;
  stream.like = Number(redisStream.likes);
  await stream.save();

  const pipeline = redis.multi();
  pipeline.del(`stream:${streamId}`);
  pipeline.del(`live:user:${userId}`);
  pipeline.srem(`live:streams`, streamId);
  pipeline.del(`streamKey:${stream.streamKey}`);
  pipeline.del(`stream:likes:${streamId}`);
  await pipeline.exec();

  await redis.publish(`stream:log:${userId}`, JSON.stringify({
    status: "stream:ended",
    msg: "stream ended due to user action or poller",
    streamId,
    createdAt: Date.now()
  }));
};
