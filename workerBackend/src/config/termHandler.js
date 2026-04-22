import { logger } from "..";
import { terminateRabbitMQ } from "./rabbitmq";
import { redis } from "./redis";

export async function handleTerm(signal, containerID, busy) {
  logger.info(`[!] Worker shutting down (${signal})`);

  try {
    if (busy) {
      logger.info("[!] Cleaning up busy state");
      await redis.hset("workers", containerID, "dead");
      busy = false;
    }
    await terminateRabbitMQ();
  } catch (err) {
    logger.info("Cleanup error:", err);
  } finally {
    process.exit(0);
  }
}
