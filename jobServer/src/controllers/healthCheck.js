import { redisConnect } from "../config/redis.js";

export const healthCheck = async (req, res) => {
  const redis = await redisConnect();
  const rabbitmq = await checkRabbitMQ();

  const healthy = redis && rabbitmq;

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),

    services: {
      redis: {
        connected: redis,
      },
      rabbitMQ: {
        connected: rabbitmq,
      },
    },
  });
};
