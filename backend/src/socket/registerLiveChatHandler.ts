import { Namespace, Socket } from "socket.io";
import { redis } from "../config/redis";

interface ChatPayload {
  streamId: string;
  message: string;
}

export function registerLiveChatHandler(io: Namespace, socket: Socket) {
  socket.on("stream:send", async ({ streamId, message }: ChatPayload) => {
    const userId = socket.data.userId;
    // do a streamId check based on redis hash
    if (!(await redis.exists(`stream:${streamId}`))) {
      return socket.emit("error", "Stream does not exist");
    }

    socket.to(streamId).emit("stream:chat", {
      message,
      userId,
      timeStamp: Date.now(),
    });
  });
}
