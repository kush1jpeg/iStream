import Redis from "ioredis";

const port = Number(process.env.REDIS_PORT) | 6379;
const host = process.env.REDIS_HOST || "redis";

// Export a single Redis instance to use across your app
export const redisClient = new Redis({
  host,
  port,
  maxRetriesPerRequest: 4,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export const redisConnect = async () => {
  try {
    await redisClient.ping();
    console.log("✅ Redis ping successful");
  } catch (error) {
    console.error("❌ Redis ping failed:", error);
  }
};
