import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { jwtkey } from "../controller/auth/register";

declare global {
  namespace Express {
    interface Request {
      id?: string; // to attach the user_id as req.id
    }
  }
}

export const authVerify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token found. Authentication denied." });
    }

    const decoded = jwt.verify(token, jwtkey) as JwtPayload;

    req.id = decoded.id;

    next();
  } catch (err: any) {
    console.error("JWT Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

import { Socket } from "socket.io";

export const socketVerify = async (socket: Socket) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("Missing token : Please Signin");

    const decoded = jwt.verify(token, jwtkey) as JwtPayload;

    socket.data.userId = decoded.id;
    return decoded.id;
  } catch (err) {
    throw new Error("Invalid token : Please Signin again");
  }
};
