import { Request, Response } from "express";
import { userModel } from "../../models/user";
import mongoose from "mongoose";
import { getFullLink } from "./getSignedLink";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userData = await userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "streams",
          localField: "_id",
          foreignField: "streamerId",
          as: "streams",
          pipeline: [
            {
              $match: {
                status: { $in: ["live", "ended"] },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "userId",
          as: "donations",
          pipeline: [
            {
              $match: {
                streamId: { $exists: true, $ne: null },
                status: "SUCCESS",
              },
            },
          ],
        },
      },
      {
        $project: {
          passwordHash: 0,
          refreshToken: 0,
          googleId: 0,
          twitchId: 0,
          Inventory: 0,
          lastReadNotificationId: 0,
        },
      },
    ]);

    if (!userData.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...userData[0],
        banner: getFullLink(userData[0].banner),
        avatar: getFullLink(userData[0].avatar),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
