import { Request, Response } from "express";
import { userModel } from "../../models/user";
import mongoose from "mongoose";
import { getFullLink } from "./getSignedLink";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
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
        },
      },
    ]);
    if (!userData.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = userData[0];
    user.avatar = user.avatar ? getFullLink(user.avatar) : null;

    user.banner = user.banner ? getFullLink(user.banner) : null;

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
