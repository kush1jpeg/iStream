import { Server } from "socket.io";
import { registerStreamHandler } from "../socket/registerStreamHandler";
import { socketAuthMiddleware } from "../middlewares/jwtVerify";
import {
  registerLiveChatHandler,
  superchatHandler,
} from "../socket/registerLiveChatHandler";
import { registerPvtChatHandler } from "../socket/registerPvtChatHandler";
import {
  redisSubNotifyListener,
  registerNotifyHandler,
} from "../socket/registerNotifyHandler";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "./redis";
import {
  registerSidebarHandler,
  SidebarRedisListener,
} from "../socket/registerSidebarHandler";
import { registerGroupChatHandler } from "../socket/registerGroupChatHandler";

const frontend_url = process.env.FRONTEND_URL || "http://localhost:8080";

export async function initSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: frontend_url, credentials: true },
  });
  const subClient = redis.duplicate();

  io.adapter(createAdapter(redis, subClient));

  // Only apply auth for DM, liveChat & notification
  io.of("/live").use(socketAuthMiddleware);
  io.of("/dm").use(socketAuthMiddleware);
  io.of("/group").use(socketAuthMiddleware);
  io.of("/notify").use(socketAuthMiddleware);
  io.of("/sidebar").use(socketAuthMiddleware);

  // Live chat
  superchatHandler(io.of("/live"));
  io.of("/live").on("connection", (socket) => {
    const live = io.of("/live");
    registerLiveChatHandler(live, socket);
  });

  // Private DM
  io.of("/dm").on("connection", (socket) => {
    console.log(
      "/dm namespace - socket connected:",
      socket.id,
      "userId:",
      socket.data.userId,
    );
    const dm = io.of("/dm");
    registerPvtChatHandler(dm, socket);
  });

  io.of("/dm").on("connect_error", (error: any) => {
    console.error(" /dm namespace - connection error:", error.message || error);
  });

  // Group DM
  io.of("/group").on("connection", (socket) => {
    console.log(
      " /group namespace - socket connected:",
      socket.id,
      "userId:",
      socket.data.userId,
    );
    const dm = io.of("/group");
    registerGroupChatHandler(dm, socket);
  });

  io.of("/group").on("connect_error", (error: any) => {
    console.error(
      " /group namespace - connection error:",
      error.message || error,
    );
  });

  // notifications
  redisSubNotifyListener(io.of("/notify")); // establishing redisSubscriber
  io.of("/notify").on("connection", (socket) => {
    const notify = io.of("/notify");
    registerNotifyHandler(notify, socket);
  });

  // sidebar quick updates
  SidebarRedisListener(io.of("/sidebar"));
  io.of("/sidebar").on("connection", (socket) => {
    const sidebar = io.of("/sidebar");
    registerSidebarHandler(sidebar, socket);
  });

  // broadcast updated count - online + active_streams
  setInterval(async () => {
    const clients = io.engine.clientsCount;
    const streams = await redis.scard("live:streams");
    io.emit("statusbar:count", {
      clients,
      streams,
    });
  }, 5000);

  // visible to all users;
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // for ping check/ signal strength
    socket.on("ping:check", (clientTime: number) => {
      socket.emit("pong:check", clientTime);
    });

    registerStreamHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}
