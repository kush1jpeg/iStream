import bcrypt from "bcryptjs";
import { userModel } from "../models/user.js";
import jwt from "jsonwebtoken";

import type { Request, Response } from "express";
import { jwtkey } from "./register.js";

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
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.json({ msg: "Wrong password", error: "error" });
    } else {
      const token = jwt.sign(
        {
          id: user._id,
        },
        jwtkey,
      );
      res.cookie(token, token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, //ms
      });

      return res.json({ msg: "logged in successfully", error: "res" });
    }
  } catch (error) {
    return res.json({ msg: "Missing details", error: "error" });
  }
};
