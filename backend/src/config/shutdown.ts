import mongoose from "mongoose";
import { redis } from "./redis";
import { server } from "..";
import { getConnection } from "./rabbitmq";

export const gracefulShutdown = async (signal: string) => {
  console.log(`\n💀 Received ${signal}. Shutting down gracefully...`);
  try {
    // close DB
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");

    // close Redis
    await redis.quit();
    console.log("✅ Redis disconnected");

    const connection = await getConnection();
    await connection.close();
    console.log("✅ rabbitmq disconnected");

    // close Socket.IO
    server.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });

    // fallback in case server.close hangs
    setTimeout(() => {
      console.warn("⚠️ Force exit after 5s");
      process.exit(1);
    }, 5000);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};
