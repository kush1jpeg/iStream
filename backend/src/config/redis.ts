import Redis from "ioredis";

const port = Number(process.env.REDIS_PORT) || 6379;
const host = process.env.REDIS_HOST || "redis";

// Export a single Redis instance to use across your app
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

export const redisSub = new Redis({ host: "redis", port });
