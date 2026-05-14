import { Request, Response } from "express";
import mongoose from "mongoose";
import { followModel } from "../../models/follow";
import { publishNotifs } from "../../services/otp/publishNotif";
import { INotification } from "../../types/types";

export const followXUnfollow = async (req: Request, res: Response) => {
  try {
    const { followedId } = req.body;
    const userId = req.id;

    if (!userId || !followedId)
      return res
        .status(400)
        .json({ error: "Both followerId and followedId are required." });

    if (userId === followedId)
      return res
        .status(400)
        .json({ error: "You cannot follow yourself, narcissist." });

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(followedId)
    )
      return res.status(400).json({ error: "Invalid user ID format." });

    const existing = await followModel.findOne({
      followerId: userId,
      followedId,
    });

    // unfollow if a req is made again

    if (existing) {
      await followModel.deleteOne({ _id: existing._id });
      return res.status(200).json({ message: "Unfollowed successfully." });
    }

    const newFollow = await followModel.create({
      followerId: userId,
      followedId,
    });
    const notify: INotification = {
      type: "follow",
      actorId: userId,
      userId: followedId,
      createdAt: Date.now(),
    };
    await publishNotifs(notify);

    return res.status(201).json({
      message: "Followed successfully.",
      follow: newFollow,
      type: "SUCCESS",
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
