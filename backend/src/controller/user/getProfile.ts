import { Request, Response } from "express";
import { userModel } from "../../models/user";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.id; // assume authVerify sets this

    // fetch user safely
    const user = await userModel
      .findById(userId)
      .select(
        "-passwordHash -lastReadNotificationId -refreshToken -googleId -twitchId",
      ) // exclude sensitive fields
      .lean(); // return plain JS object

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
