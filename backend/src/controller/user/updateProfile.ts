import { Request, Response } from "express";
import { userModel } from "../../models/user";
import { getFullLink } from "./getSignedLink";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
    const { username, bio, avatar, banner, websiteId, currentAnimation } =
      req.body;

    const updates: Record<string, any> = {};

    if (username !== undefined) {
      if (username.length < 1 || username.length > 20) {
        return res.status(400).json({
          message: "Username must be 1–20 characters",
        });
      }
    }

    updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (banner !== undefined) updates.banner = banner;
    if (websiteId !== undefined) updates.websiteId = websiteId;
    if (currentAnimation !== undefined)
      updates.currentAnimation = currentAnimation;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided",
      });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
            select: "-passwordHash -refreshToken -googleId -twitchId -Inventory -lastReadNotificationId",
      },
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser,

        banner: updatedUser.banner.isCloud
          ? getFullLink(updatedUser.banner.value)
          : updatedUser.banner.value,

        avatar: updatedUser.avatar.isCloud
          ? getFullLink(updatedUser.avatar.value)
          : updatedUser.avatar.value,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
