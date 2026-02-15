import type { NextFunction, Request, Response } from "express";
import { userModel } from "../models/user.js";

export const isVerified = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.id;
    const user = await userModel.findById(id);
    if (!user) {
      return res.json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.json({ message: "User not verified for streaming" });
    }
    next();
  } catch (err: any) {
    console.error("JWT Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};
