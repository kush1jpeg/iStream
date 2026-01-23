import { Server } from "socket.io";
import { registerStreamHandler } from "../socket/registerStreamHandler";
import { registerLiveChatHandler } from "../socket/registerLiveChatHandler";

export function initSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    registerStreamHandler(io, socket);
    registerLiveChatHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}
