import bcrypt from "bcryptjs";
import { userModel } from "../models/user.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const jwtkey = process.env.JWT_SECRET || "supersecret";

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
    const username = email.split("@")[0].slice(0, 10); // limited to 10 chars;
    const newUser = new userModel({
      username,
      email,
      passwordHash: hashpassword,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
      },
      jwtkey,
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, //ms
    });

    await newUser.save();

    return res.json({ msg: "user created" });
  } catch (error) {
    return res.json({ msg: "Missing details", error });
  }
};
