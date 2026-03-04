import { Server } from "socket.io";
import { registerStreamHandler } from "../socket/registerStreamHandler";
import { socketAuthMiddleware } from "../middlewares/jwtVerify";
import {
  registerLiveChatHandler,
  superchatHandler,
} from "../socket/registerLiveChatHandler";
import { registerPvtChatHandler } from "../socket/registerPvtChatHandler";
import { registerNotifyHandler } from "../socket/registerNotifyHandler";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { redisSubNotify } from "./redis";

export async function initSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  const pubClient = new Redis({ host: "redis", port: 6379 });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  // Only apply auth for DM, liveChat & notification
  io.of("/live").use(socketAuthMiddleware);
  io.of("/dm").use(socketAuthMiddleware);
  io.of("/group").use(socketAuthMiddleware);
  io.of("/notify").use(socketAuthMiddleware);

  // Live chat
  superchatHandler(io.of("/live"));
  io.of("/live").on("connection", (socket) => {
    const live = io.of("/live");
    registerLiveChatHandler(live, socket);
  });

  // Private DM
  io.of("/dm").on("connection", (socket) => {
    const dm = io.of("/dm");
    registerPvtChatHandler(dm, socket);
  });

  // Group DM
  io.of("/group").on("connection", (socket) => {
    const dm = io.of("/group");
    registerPvtChatHandler(dm, socket);
  });

  // notifications
  redisSubNotify(io.of("/notify")); // establishing redisSubscriber
  io.of("/notify").on("connection", (socket) => {
    const notify = io.of("/notify");
    registerNotifyHandler(notify, socket);
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
