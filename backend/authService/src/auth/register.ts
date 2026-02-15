import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { userModel } from "../../models/user";

export const jwtkey = process.env.JWT_SECRET!;
export const refreshKey = process.env.REFRESH_SECRET!;

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.json({ msg: "Missing details", error: "error" });
  }
  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ msg: "login instead", error: "already present" });
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

    await newUser.save();

    return res.json({ msg: "user created" });
  } catch (error) {
    return res.json({ msg: "Missing details", error });
  }
};
