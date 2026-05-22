import { Request, Response } from "express";
import { userModel } from "../../models/user";
import mongoose from "mongoose";
import { getFullLink } from "./getSignedLink";
import { followModel } from "../../models/follow";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const userId = req.id;

    const userData = await userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(profileId),
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

    console.log("userData - ", userData);
    console.log("Id:", userId);
    console.log("profileId:", profileId);
    const user = userData[0];

    const follow = await followModel.exists({
      followerId: new mongoose.Types.ObjectId(userId),
      followedId: new mongoose.Types.ObjectId(profileId),
    });
    console.log("exists result:", follow);

    return res.status(200).json({
      success: true,
      following: !!follow,
      user: {
        ...user,

        banner: user.banner.isCloud
          ? getFullLink(user.banner.value)
          : user.banner.value,

        avatar: user.avatar.isCloud
          ? getFullLink(user.avatar.value)
          : user.avatar.value,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
