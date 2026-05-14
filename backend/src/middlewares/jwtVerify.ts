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
import cookie from "cookie";

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) return next(new Error("AUTH_MISSING"));

    const cookies = cookie.parse(rawCookie);
    const token = cookies.accessToken;
    if (!token) return next(new Error("AUTH_MISSING"));

    const decoded = jwt.verify(token, jwtkey) as JwtPayload;
    if (!decoded.id) return next(new Error("AUTH_INVALID"));

    socket.data.userId = decoded.id;
    next();
  } catch (err) {
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
