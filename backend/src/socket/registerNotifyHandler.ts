import { Namespace, Socket } from "socket.io";
import { redis, redisSub } from "../config/redis";
import { INotification, IStreamLog } from "../types/types";

export function registerNotifyHandler(io: Namespace, socket: Socket) {
  socket.join(socket.data.userId);
}

export const redisSubNotifyListener = async (io: Namespace) => {
  redisSub.subscribe("notifications", (ch, msg) => {
    if (!msg) {
      console.warn("Empty notifications");
      return;
    }
    try {
      const strMsg = typeof msg === "string" ? msg : msg.toString();
      const payload = JSON.parse(strMsg) as INotification;
      io.to(String(payload.userId)).emit("notifications", msg);
    } catch (err) {
      console.error("Invalid notification payload", err);
    }
  });

  redisSub.subscribe("stream:log", (msg) => {
    if (!msg) {
      console.warn("Empty stream-logs");
      return;
    }
    try {
      const strMsg = typeof msg === "string" ? msg : msg.toString();
      const payload = JSON.parse(strMsg) as IStreamLog;

      io.to(String(payload.userId)).emit("stream:logs", msg);
    } catch (err) {
      console.error("Invalid notification payload", err);
    }
  });
};
