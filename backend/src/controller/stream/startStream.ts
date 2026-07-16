import type { Request, Response } from "express";
import { redis } from "../../config/redis";
import { streamModel } from "../../models/stream";
import { userModel } from "../../models/user";
import { INotification, IStreamRedis } from "@istream/shared";
import { publishNotifs } from "../../services/otp/publishNotif";
import { getFullLink } from "../user/getSignedLink";

const HLS_PATH = process.env.HLS_BASE_URL || "http://localhost:8888/hls/";
const VOD_PATH = `${process.env.R2_PUBLIC_URL}/hls/live/`;

export const startStream = async (req: Request, res: Response) => {
  const { streamId, thumbnail } = req.body;
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
  if (!stream.isCloud) stream.thumbnail = thumbnail;
  stream.VOD_URL = `${VOD_PATH}${stream.streamKey}/master.m3u8`;
  stream.startedAt = new Date();
  await stream.save();

  // storing minimal user details
  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  user.isLive = true;
  await user.save();
  // streamer: as the stream starts create redis stream details;
  const redisData: IStreamRedis = {
    streamer: JSON.stringify({
      username: user?.username,
      avatar: user?.avatar.isCloud
        ? getFullLink(user.avatar.value)
        : user.avatar.value,
      frame: user?.currentFrame,
      animation: user?.currentAnimation,
    }),

    stream: JSON.stringify({
      title: stream.title,
      description: stream.description,
      thumbnail: stream.isCloud
        ? getFullLink(stream.thumbnail)
        : stream.thumbnail,
      tags: stream.tags,
    }),
    streamerId: String(userId),
    streamId: String(streamId),
    streamKey: stream.streamKey,
    HLS_PATH: `${HLS_PATH}/${stream.streamKey}/master.m3u8`,
    inactiveSince: "",
    status: "pending",
    viewers: "0",
    likes: "0",
    views: "0",
    createdAt: new Date().toISOString(),
  };

  const pipeline = redis.multi();
  pipeline.hset(`stream:${streamId}`, redisData);
  pipeline.set(`live:user:${userId}`, streamId); // to track weather a person is streaming or not;
  pipeline.sadd(`live:streams`, streamId);

  // for job-server auth
  pipeline.set(`streamKey:${stream.streamKey}`, streamId, "EX", 15);
  // if server dies ->  key auto-expires after 15sec -> job-server marks it as inactive -> queue clears it
  await pipeline.exec();

  const notify: INotification = {
    type: "stream",
    userId: stream.streamerId,
    createdAt: Date.now(),
  };
  await publishNotifs(notify);
  return res
    .status(201)
    .json({ success: true, message: "Stream started successfully" });
};
