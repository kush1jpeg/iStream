import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import { streamModel } from "../../models/stream";
import { userModel } from "../../models/user";

const HLS_PATH = process.env.HLS_BASE_URL || "http://localhost:8888/hls/live/";

export const startStream = async (req: Request, res: Response) => {
  const { streamId } = req.body;
  if (!streamId) {
    return res
      .status(400)
      .json({ success: false, message: "Stream ID required" });
  }

  const userId = req.id;
  const stream = await streamModel.findById(streamId);

  if (!stream) {
    return res
      .status(404)
      .json({ success: false, message: "Stream not found" });
  }
  if (stream.streamerId.toString() !== userId) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized User access" });
  }

  stream.status = "live";
  stream.expiresAt = null;
  stream.startedAt = new Date();
  await stream.save();

  // storing minimal user details
  const user = await userModel.findById(userId, {
    username: 1,
    avatar: 1,
    currentAnimation: 1,
  });

  // streamer: as the stream starts create redis stream details;
  const redisData = {
    streamer: {
      id: userId,
      username: user?.username,
      avatar: user?.avatar,
      frame: user?.currentFrame,
      animation: user?.currentAnimation,
    },

    stream: {
      title: stream.title,
      description: stream.description,
      thumbnail: stream.thumbnail,
      tags: stream.tags,
      HLS_PATH,
    },

    viewers: 0,
    views: 0,
    createdAt: new Date().toISOString(),
  };

  const pipeline = redis.multi();
  pipeline.hset(`stream:${streamId}`, redisData);
  pipeline.set(`live:user:${userId}`, streamId); // to track weather a person is streaming or not;
  pipeline.sadd(`live:streams`, streamId);

  // for job-server auth
  pipeline.set(`streamKey:${stream.streamKeyHash}`, streamId);

  await pipeline.exec();
};
