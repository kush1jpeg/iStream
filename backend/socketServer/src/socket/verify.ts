import { Socket } from "socket.io";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_KEY = process.env.JWT_KEY!;

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("AUTH_MISSING"));
    }

    const decoded = jwt.verify(token, JWT_KEY) as JwtPayload;

    if (!decoded.id) {
      return next(new Error("AUTH_INVALID"));
    }

    // attach identity to socket
    socket.data.userId = decoded.id;
    socket.data.role = decoded.role; // optional

    next();
  } catch (err) {
    return next(new Error("AUTH_INVALID"));
  }
};
