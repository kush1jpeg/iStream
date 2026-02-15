import { userModel } from "../../models/user";
import type { Request, Response } from "express";

export const userBatchDetails = async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) return res.status(400).json({ msg: "No IDs provided" });

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return res.status(400).json({ msg: "No valid IDs" });

    // Fetch profiles from MongoDB
    const users = await userModel
      .find(
        { _id: { $in: ids } },
        { username: 1, avatar: 1, currentAnimation: 1 },
      ) // select only needed fields
      .lean();

    // Return as object keyed by userId for easier frontend merging
    const result: Record<string, any> = {};
    users.forEach((u) => {
      result[u._id.toString()] = {
        username: u.username,
        avatar: u.avatar,
        currentAnimation: u.currentAnimation,
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error("Batch user fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
