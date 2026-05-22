import { Namespace, Socket } from "socket.io";
import { redis, redisSub } from "../config/redis";
import { followModel } from "../models/follow";
import { userModel } from "../models/user";
import mongoose from "mongoose";
import { getFullLink } from "../controller/user/getSignedLink";

let userId: string;
export function registerSidebarHandler(io: Namespace, socket: Socket) {
  io.on("connection", async (socket) => {
    userId = socket.data.userId;
    socket.join(userId);

    // send initial state on connect
    const data = await getSidebarData(userId);
    console.log("sidebar:init-", data);
    socket.emit("sidebar:init", data);

    socket.on("disconnect", () => {
      socket.leave(userId);
    });
  });
}

export function SidebarRedisListener(io: Namespace) {
  // redis sub for live updates
  redisSub.subscribe("notifications");
  redisSub.on("message", (channel, message) => {
    try {
      const payload = JSON.parse(message);
      console.log("[+]Payload :", payload);
      if (payload.type !== "stream" || payload.userId !== userId) return;
      io.to(payload.userId).emit("sidebar:update", payload);
    } catch (err) {
      console.error("sidebar pmessage error:", err);
    }
  });
}

const resolveAvatar = (avatar: any) => {
  if (!avatar) return null;
  return avatar.isCloud ? getFullLink(avatar.value) : avatar.value;
};

export const getSidebarData = async (userId: string) => {
  const following = await followModel
    .find({ followerId: userId })
    .select("followedId")
    .lean();

  if (following.length === 0) {
    // no following -> return random streaming or random 5 people
    return getRandomFallback(userId);
  }

  const followingIds = following.map((f) => f.followedId.toString());

  // 2. check redis for live status
  const pipeline = redis.pipeline();
  followingIds.forEach((id) => pipeline.get(`live:user:${id}`));
  const results = await pipeline.exec();

  const liveFollowing: any[] = [];
  const offlineIds: string[] = [];

  results?.forEach((res, i) => {
    const streamId = res?.[1];
    if (streamId) {
      liveFollowing.push({ userId: followingIds[i], streamId, isLive: true });
    } else {
      offlineIds.push(followingIds[i]);
    }
  });

  // 3. if some are live, return live first then offline
  if (liveFollowing.length > 0) {
    const offline = await userModel
      .find({ _id: { $in: offlineIds } })
      .select("username avatar currentFrame")
      .limit(5)
      .lean();
    const offlineUsers = offline.map((u) => ({
      ...u,
      avatar: resolveAvatar(u.avatar),
    }));
    return {
      live: liveFollowing,
      offline: offlineUsers,
    };
  }

  // 4. none following are live; return offline following
  const offline = await userModel
    .find({ _id: { $in: followingIds } })
    .select("username avatar currentFrame")
    .limit(5)
    .lean();
  const offlineUsers = offline.map((u) => ({
    ...u,
    avatar: resolveAvatar(u.avatar),
  }));

  return { live: [], offline: offlineUsers };
};

const getRandomFallback = async (userId: string) => {
  // check if anyone is streaming
  const liveStreamIds = await redis.smembers("live:streams");
  console.log("random init suggestions");
  if (liveStreamIds.length > 0) {
    const randomLive = liveStreamIds
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const streamData = await Promise.all(
      randomLive.map((id) => redis.hgetall(`stream:${id}`)),
    );

    return { live: streamData.filter(Boolean), offline: [] };
  }

  // if nobody streaming then random 5 people
  const users = await userModel.aggregate([
    { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
    { $sample: { size: 5 } },
    { $project: { username: 1, avatar: 1, currentFrame: 1 } },
  ]);
  const randomUsers = users.map((u) => ({
    ...u,
    avatar: resolveAvatar(u.avatar),
  }));

  return { live: [], offline: randomUsers };
};
