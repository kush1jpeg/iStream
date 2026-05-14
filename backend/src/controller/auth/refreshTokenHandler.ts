import { userModel } from "../../models/user";
import type { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtkey, refreshKey } from "./register";

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  console.log("refreshing the cookies");
  if (!refreshToken) return res.status(401).json({ msg: "No token" });

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, refreshKey) as JwtPayload;

    const user = await userModel.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ msg: "Invalid token" });

    // Issue new access token
    const accessToken = jwt.sign({ id: user._id }, jwtkey, {
      expiresIn: "15m",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ msg: "Access token refreshed" });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ msg: "Token invalid or expired" });
  }
};
