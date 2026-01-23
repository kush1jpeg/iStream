import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";
import { socketVerify } from "../middlewares/jwtVerify";

interface ChatPayload {
  streamId: string;
  message: string;
}

export function registerLiveChatHandler(io: Server, socket: Socket) {
  socket.on("chat:send", async ({ streamId, message }: ChatPayload) => {
    let userId: string;
    try {
      userId = await socketVerify(socket);
    } catch (error) {
      return socket.emit("error", error);
    }

    // do a streamId check based on redis hash
    if (!(await redis.exists(`stream:${streamId}`))) {
      return socket.emit("error", "Stream does not exist");
    }

    io.to(streamId).emit("stream:chat", {
      message,
      userId,
      timeStamp: Date.now(),
    });
  });
}
