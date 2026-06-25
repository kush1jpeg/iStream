import { Namespace, Socket } from "socket.io";
import { redis, redisSub } from "../config/redis";
import { followModel } from "../models/follow";
import { userModel } from "../models/user";
import mongoose from "mongoose";
import { getFullLink } from "../controller/user/getSignedLink";

type SidebarUser = {
  _id: string;
  username: string;
  avatar: string;
  currentFrame?: string;
  isLive?: boolean;
};


export function registerSidebarHandler(_io: Namespace, socket: Socket) {
  const userId = socket.data.userId;
  if (!userId) {
    socket.emit("sidebar:error", { code: "USER_MISSING" });
    return;
  }

  socket.join(userId);

  getSidebarData(userId)
    .then((data) => {
      socket.emit("sidebar:init", data);
    })
    .catch((err) => {
      console.error("sidebar:init failed", err);
      socket.emit("sidebar:error", { code: "SIDEBAR_INIT_FAILED" });
    });
}

let sidebarRedisListenerReady = false;
export function SidebarRedisListener(io: Namespace) {
  if (sidebarRedisListenerReady) return;
  sidebarRedisListenerReady = true;

  // redis sub for live updates
  redisSub.subscribe("notifications");
  redisSub.on("message", async (_channel, message) => {
    try {
      const payload = JSON.parse(message);
      console.log("[+]Payload :", payload);
      if (payload.type !== "stream" || !payload.userId) return;

      const followers = await followModel
        .find({ followedId: payload.userId })
        .select("followerId")
        .lean();

      followers.forEach((follow) => {
        io.to(follow.followerId.toString()).emit("sidebar:update", payload);
      });
    } catch (err) {
      console.error("sidebar pmessage error:", err);
    }
  });
}

const resolveAvatar = (avatar: any) => {
  if (!avatar) return null;
  return avatar.isCloud ? getFullLink(avatar.value) : avatar.value;
};

export const getSidebarData = async (
  userId: string,
): Promise<{ live: SidebarUser[]; offline: SidebarUser[] }> => {
  const following = await followModel
    .find({ followerId: userId, followedId: { $ne: userId } })
    .select("followedId")
    .lean();

  if (following.length === 0) {
    return getRandomFallback(userId);
  }

  const followingIds = following.map((f) => f.followedId.toString());

  const pipeline = redis.pipeline();
  followingIds.forEach((id) => pipeline.get(`live:user:${id}`));
  const results = await pipeline.exec();

  const liveIds: string[] = [];
  const offlineIds: string[] = [];

  results?.forEach((res, i) => {
    const streamId = res?.[1];
    if (streamId) liveIds.push(followingIds[i]);
    else offlineIds.push(followingIds[i]);
  });

  const liveUsers = await userModel
    .find({ _id: { $in: liveIds } })
    .select("username avatar currentFrame")
    .lean();

  const live: SidebarUser[] = liveUsers.map((u) => ({
    _id: u._id.toString(),
    username: u.username,
    avatar: resolveAvatar(u.avatar),
    currentFrame: u.currentFrame,
    isLive: true,
  }));

  const offlineUsers = await userModel
    .find({ _id: { $in: offlineIds } })
    .select("username avatar currentFrame")
    .limit(5)
    .lean();

  const offline: SidebarUser[] = offlineUsers.map((u) => ({
    _id: u._id.toString(),
    username: u.username,
    avatar: resolveAvatar(u.avatar),
    currentFrame: u.currentFrame,
    isLive: false,
  }));

  const length = live.length + offline.length;
  if (length < 7) {
    const missing = 7 - length;
    const randomUsers = await userModel.aggregate([
      {
        $match: {
          _id: {
            $nin: [
              new mongoose.Types.ObjectId(userId),
              ...live.map((u) => new mongoose.Types.ObjectId(u._id)),
              ...offline.map((u) => new mongoose.Types.ObjectId(u._id)),
            ],
          },
        },
      },
      { $sample: { size: missing } },
      { $project: { username: 1, avatar: 1, currentFrame: 1, isLive: 1 } },
    ]);

    const fallbackUsers: SidebarUser[] = randomUsers.map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      avatar: resolveAvatar(u.avatar),
      currentFrame: u.currentFrame,
      isLive: u.isLive,
    }));

    offline.push(...fallbackUsers);
  }

  return { live, offline };
};

const getRandomFallback = async (
  userId: string,
): Promise<{ live: SidebarUser[]; offline: SidebarUser[] }> => {
  const liveStreamIds = await redis.smembers("live:streams");

  if (liveStreamIds.length > 0) {
    const randomLive = liveStreamIds
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const streamData = await Promise.all(
      randomLive.map((id) => redis.hgetall(`stream:${id}`)),
    );

    const live: SidebarUser[] = streamData
      .filter(Boolean)
      .filter((item: any) => item.streamerId !== userId)
      .map((item: any) => {
        const streamer =
          typeof item.streamer === "string"
            ? JSON.parse(item.streamer)
            : item.streamer;

        return {
          _id: item.streamerId,
          username: streamer?.username ?? "",
          avatar: streamer?.avatar ?? "",
          currentFrame: streamer?.frame,
          isLive: item.status === "live",
        };
      });

    return {
      live,
      offline: [],
    };
  }

  const users = await userModel.aggregate([
    { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
    { $sample: { size: 5 } },
    { $project: { username: 1, avatar: 1, currentFrame: 1 } },
  ]);

  const offline: SidebarUser[] = users.map((u) => ({
    _id: u._id.toString(),
    username: u.username,
    avatar: resolveAvatar(u.avatar),
    currentFrame: u.currentFrame,
    isLive: false,
  }));

  return { live: [], offline };
};
