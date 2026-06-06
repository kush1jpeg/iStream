import type { Request, Response } from "express";
import { checkRabbitMQ } from "../config/rabbitmq";
import { checkRedis } from "../config/redis";
import { mongoStatus } from "../config/mongoose";

export const healthCheck = async (req: Request, res: Response) => {
  const mongo = mongoStatus();
  const redis = await checkRedis();
  const rabbitmq = await checkRabbitMQ();

  const healthy = mongo.connected && redis && rabbitmq;

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),

    services: {
      mongoDB: mongo,
      redis: {
        connected: redis,
      },
      rabbitMQ: {
        connected: rabbitmq,
      },
    },
  });
};
