import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import type { Request, Response } from "express";
import { jwtkey, refreshKey } from "./register.js";
import { userModel } from "../../models/user.js";
import { IUser } from "../../types/types.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!(email && password)) {
    return res.json({ msg: "Missing details", error: "error" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ msg: "Invalid email", error: "Not found" });
    }
    if (!user.passwordHash) {
      return res.json({ msg: "saved password not found", error: "Not found" });
    }
    const match = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!match) {
      return res.json({ msg: "Wrong password", error: "error" });
    } else {
      const refreshToken = jwt.sign(
        {
          id: user._id,
        },
        refreshKey,
        { expiresIn: "7d" },
      );

      user.refreshToken = refreshToken;

      const accessToken = jwt.sign(
        {
          id: user._id,
        },
        jwtkey,
        { expiresIn: "15m" },
      );

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

      await user.save();

      return res.json({ msg: "logged in successfully", type: "SUCCESS" });
    }
  } catch (error) {
    return res.json({ type: "FAILURE", msg: error });
  }
};

export const loginXgoogle = async (req: Request, res: Response) => {
  const passportUser = req.user as IUser; // callback gives user in req
  const user = await userModel.findById(passportUser._id);
  if (!user)
    return res.status(404).json({ msg: "User not found", type: "FAILURE" });
  req.id = user.id;

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    refreshKey,
    { expiresIn: "7d" },
  );

  user.refreshToken = refreshToken;

  const accessToken = jwt.sign(
    {
      id: user._id,
    },
    jwtkey,
    { expiresIn: "15m" },
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await user.save();

  return res.redirect(`${process.env.FRONTEND_URL}`);
};
