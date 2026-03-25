import Redis from "ioredis";
import { Namespace } from "socket.io";
import { INotification, IStreamLog } from "../types/types";

const port = Number(process.env.REDIS_PORT) || 6379;

// Export a single Redis instance to use across your app
export const redis = new Redis({ host: "redis", port });

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export const redisConnect = async () => {
  try {
    await redis.ping();
    console.log("✅ Redis ping successful");
    return true;
  } catch (error) {
    console.error("❌ Redis ping failed:", error);
    process.exit(1); // fail fast if Redis is down
  }
};

export const redisSubNotify = async (io: Namespace) => {
  redis.subscribe("notifications", (msg) => {
    if (!msg) throw new Error("error during registerNotifyHandler");
    try {
      const strMsg = typeof msg === "string" ? msg : msg.toString();
      const payload = JSON.parse(strMsg) as INotification;
      io.to(JSON.stringify(payload.userId)).emit("notifications", msg);
    } catch (err) {
      console.error("Invalid notification payload", err);
    }
  });

  redis.subscribe("stream:log", (msg) => {
    if (!msg) throw new Error("error during registerNotifyHandler");
    try {
      const strMsg = typeof msg === "string" ? msg : msg.toString();
      const payload = JSON.parse(strMsg) as IStreamLog;
      io.to(JSON.stringify(payload.userId)).emit("notifications", msg);
    } catch (err) {
      console.error("Invalid notification payload", err);
    }
  });
};
