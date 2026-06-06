import { Namespace, Socket } from "socket.io";
import { redis } from "../config/redis";
import { getPayChannel } from "../config/rabbitmq";
import { IPay } from "../types/types";

interface ChatPayload {
  streamId: string;
  msg: string;
}

export function registerLiveChatHandler(io: Namespace, socket: Socket) {
  socket.on("stream:send", async ({ streamId, msg }: ChatPayload) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (!(await redis.exists(`stream:${streamId}`))) {
      return socket.emit("error", "Stream does not exist");
    }
    socket.to(streamId).emit("stream:chat", {
      msg,
      userId,
      username,
      createdAt: Date.now(),
    });
  });
}

export async function superchatHandler(io: Namespace) {
  const channel = await getPayChannel();
  channel.consume(
    "payment_superchat",
    async (msg) => {
      if (!msg) return;
      const payload = JSON.parse(msg.content.toString()) as IPay as IPay;
      const superchat = {
        userId: payload.userId,
        username: payload.username,
        message: payload.message,
        amount: payload.amount,
        streamId: payload.streamId,
        userPfp: payload.userPfp,
        currency: payload.currency,
        status: payload.status,
        createdAt: payload.createdAt,
      };
      io.to(payload.streamId!.toString()).emit(
        "superchat",
        JSON.stringify(superchat),
      );

      channel.ack(msg);
    },
    { noAck: false },
  );
}
