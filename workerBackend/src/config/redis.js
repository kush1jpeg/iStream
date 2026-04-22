import Redis from "ioredis";
import { logger } from "../index.js";

const port = Number(process.env.REDIS_PORT) | 6379;
const host = process.env.REDIS_HOST || "redis";

export const redis = new Redis({
  host,
  port,
  maxRetriesPerRequest: 4,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  logger.error("❌ Redis connection error:", err);
});

export const redisConnect = async () => {
  try {
    await redis.ping();
    logger.info("✅ Redis ping successful");
    return true;
  } catch (error) {
    logger.error("❌ Redis ping failed:", error);
  }
};
