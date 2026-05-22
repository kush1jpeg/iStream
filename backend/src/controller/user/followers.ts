import { Request, Response } from "express";
import mongoose from "mongoose";
import { followModel } from "../../models/follow";
import { getFullLink } from "./getSignedLink";

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const followers = await followModel.aggregate([
      { $match: { followedId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "followerInfo",
        },
      },
      { $unwind: "$followerInfo" },
      {
        $project: {
          _id: 0,
          id: "$followerInfo._id",
          username: "$followerInfo.username",
          isStreaming: "$followerInfo.isStreaming",
          avatar: "$followerInfo.avatar",
        },
      },
    ]);

    const formattedFollowers = followers.map((user) => ({
      ...user,
      avatar: user.avatar.isCloud
        ? getFullLink(user.avatar.value)
        : user.avatar.value,
    }));

    return res.status(200).json({
      page,
      limit,
      count: formattedFollowers.length,
      formattedFollowers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
