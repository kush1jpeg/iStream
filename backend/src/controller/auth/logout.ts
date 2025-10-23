import type { Request, Response } from "express";
import { userModel } from "../models/user.js";

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error during logout" });
  }
};

export const deleteAcc = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    const username = req.body.username;
    const id = req.id;
    if (!id) return res.json({ msg: "UserId not logged in" });
    const user = await userModel.findById(id);
    if (!user) return res.json({ msg: "User not present" });
    if (username == user.username) await userModel.deleteOne({ _id: id });
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error during logout" });
  }
};
