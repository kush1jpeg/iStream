import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { getFullLink } from "./getSignedLink";
import { redis } from "../../config/redis";
import { followModel } from "../../models/follow";

export const search = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.user).trim();
    console.log(query);
    const userId = req.id;
    console.log("userId in search:", userId);

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const foundUsers = await userModel.aggregate([
      {
        $search: {
          index: "istream",
          autocomplete: {
            query,
            path: "username",
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          username: 1,
          isLive: 1,
          avatar: 1,
          isStreaming: 1,
        },
      },
    ]);
    console.log("found users -", foundUsers);

    if (!userId) {
      // if the person is not logged in
      const data = foundUsers.map((user) => ({
        ...user,
        avatar: getFullLink(user.avatar),
      }));

      return res.status(200).json(data);
    }

    const followChecks = await followModel.find(
      {
        followerId: userId,
        followedId: { $in: foundUsers.map((u) => u._id) },
      },
      { followedId: 1 },
    );
    console.log("followd check -", followChecks);

    const followedSet = new Set(
      followChecks.map((f) => f.followedId.toString()),
    );
    console.log("followd set -", followedSet);

    const pipeline = redis.pipeline();
    foundUsers.forEach((u) => pipeline.get(`live:user:${u._id}`));
    const output = await pipeline.exec();

    const withMeta = foundUsers.map((user, i) => {
      const streamId = output![i][1] as string | null;
      return {
        ...user,
        avatar: getFullLink(user.avatar),
        isLive: !!streamId,
        streamId: streamId ?? null,
        followed: followedSet.has(String(user._id)),
      };
    });

    return res.status(200).json(withMeta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};
