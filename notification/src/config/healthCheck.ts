import type { Request, Response } from "express";
import { checkRabbitMQ } from "../config/rabbitmq";
import { redisConnect } from "./redis";
import { mongoStatus } from "./mongoose";

export const healthCheck = async (req: Request, res: Response) => {
  const mongo = mongoStatus();
  const redis = await redisConnect();
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
