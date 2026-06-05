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
    const token = req.cookies?.accessToken;
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
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

import { Socket } from "socket.io";
import { parse as parseCookie } from "cookie";
import { userModel } from "../models/user";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    console.log("[Socket_Auth] - checking cookie:", { rawCookie: !!rawCookie });

    if (!rawCookie) {
      console.log("[AUTH_MISSING]: No cookie header");
      return next(new Error("AUTH_MISSING"));
    }

    const cookies = parseCookie(rawCookie);
    console.log("[Parsed cookies keys]:", Object.keys(cookies));

    const token = cookies.accessToken;
    if (!token) {
      console.log("[AUTH_MISSING]: No accessToken in cookies");
      return next(new Error("AUTH_MISSING"));
    }
    const decoded = jwt.verify(token, jwtkey) as JwtPayload;

    if (!decoded.id) {
      console.log("[AUTH_INVALID]: No id in decoded token");
      return next(new Error("AUTH_INVALID"));
    }

    console.log("Socket auth successful, userId:", decoded.id);
    socket.data.userId = decoded.id;
    const user = await userModel.findById(decoded.id, { username: 1 });
    if (!user) {
      return next(new Error("AUTH_INVALID"));
    }
    socket.data.username = user.username;

    next();
  } catch (err: any) {
    console.error("[Socket_Auth_Error]:", err.message);
    return next(new Error("AUTH_INVALID"));
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next();

    const decoded = jwt.verify(token, jwtkey) as JwtPayload;
    req.id = decoded.id;
    console.log(decoded.id, "decoded Id");
    next();
  } catch {
    next();
  }
};
// verifyInternalSecret middleware to call bw microservices
// export const verifyInternalSecret = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const secret = req.headers["x-internal-secret"];
//   if (secret !== process.env.INTERNAL_SECRET) {
//     return res.status(403).json({ error: "forbidden Request" });
//   }
//   next();
// };
