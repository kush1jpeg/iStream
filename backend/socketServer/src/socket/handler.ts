import { Server } from "socket.io";
import { socketAuthMiddleware } from "./verify";
import { registerLiveChatHandler } from "./register/registerLiveChatHandler";
import { registerPvtChatHandler } from "./register/registerPvtChatHandler";
import { registerGroupChatHandler } from "./register/registerGroupChatHandler";
import { registerStreamHandler } from "./register/registerStreamHandler";
import { LRUCache } from "lru-cache";

const options = {
  max: 500,
  ttl: 1000 * 60 * 10, // 10 minutes
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

export const conversationCache = new LRUCache<string, Set<string>>(options);

export async function socketHandler(io: Server) {
  // Only apply auth for DM,GroupChat & liveChat
  io.of("/live").use(socketAuthMiddleware);
  io.of("/dm").use(socketAuthMiddleware);
  io.of("/group").use(socketAuthMiddleware);

  // Live chat

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
    registerGroupChatHandler(dm, socket);
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
