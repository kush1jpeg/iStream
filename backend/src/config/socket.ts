import { Server } from "socket.io";
import { registerStreamHandler } from "../socket/registerStreamHandler";
import { socketVerify } from "../middlewares/jwtVerify";
import { registerLiveChatHandler } from "../socket/registerLiveChatHandler";
import { registerPvtChatHandler } from "../socket/registerPvtChatHandler";

export function initSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // Only apply auth for DM & liveChat

  // Live chat
  io.of("/live").use(async (socket, next) => {
    try {
      const userId = await socketVerify(socket);
      socket.data.userId = userId;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });
  io.of("/live").on("connection", (socket) => {
    registerLiveChatHandler(io, socket);
  });

  // Private DM
  io.of("/dm").use(async (socket, next) => {
    try {
      const userId = await socketVerify(socket);
      socket.data.userId = userId;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });
  io.of("/dm").on("connection", (socket) => {
    registerPvtChatHandler(io, socket);
  });

  // visible to all users;
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    registerStreamHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}
