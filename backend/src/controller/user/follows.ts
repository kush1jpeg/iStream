import { Request, Response } from "express";
import mongoose from "mongoose";
import { followModel } from "../../models/follow.js";

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const following = await followModel.aggregate([
      { $match: { followerId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "followedId",
          foreignField: "_id",
          as: "followedInfo",
        },
      },
      { $unwind: "$followedInfo" },
      {
        $project: {
          id: "$followedInfo._id",
          username: "$followedInfo.username",
          avatar: "$followedInfo.avatar",
          isStreaming: "$followedInfo.isStreaming",
          // add any other fields like email, verified, etc.
        },
      },
    ]);
    return res.status(200).json({
      page,
      limit,
      count: following.length,
      following,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
