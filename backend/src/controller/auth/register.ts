import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { userModel } from "../../models/user";
import { sendOTP } from "../../services/otp/otp";

export const jwtkey = process.env.JWT_SECRET!;
export const refreshKey = process.env.REFRESH_SECRET!;

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.json({ msg: "MISSING", error: "error" });
  }
  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res
        .status(409)
        .json({ msg: "LOGIN_INSTEAD", error: "already present" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const username = email.split("@")[0].slice(0, 20); // limited to 20 chars;
    const newUser = new userModel({
      username,
      email,
      passwordHash: hashpassword,
    });

    const accessToken = jwt.sign(
      {
        id: newUser._id,
      },
      jwtkey,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      {
        id: newUser._id,
      },
      refreshKey,
      { expiresIn: "7d" },
    );

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, //ms
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await sendOTP(newUser.id);

    return res.json({ msg: "OTP_SENT", type: "OTP" });
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      MISSING: 404,
      LOGIN_INSTEAD: 401,
      OTP_ALREADY_SENT: 429,
      CHANNEL_UNAVAILABLE: 503,
    };
    return res.status(statusMap[err.message] || 500).json({
      type: "FAILURE",
      message: err.message,
    });
  }
};
