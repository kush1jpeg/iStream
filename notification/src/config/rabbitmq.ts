import amqp, { Channel } from "amqplib";

export async function connectToRabbitMQ() {
  const RABBITMQ_URL = "amqp://guest:guest@rabbitmq:5672"; // container name as host
  while (true) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      console.log("🔥 Connected to RabbitMQ in Docker network!");
      return { connection };
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error);
      throw new Error("unreachable");
    }
  }
}

export async function bindExchange(
  channel: Channel,
  exchange: string,
  queues: Array<string>,
) {
  try {
    for (let q of queues) {
      await channel.assertQueue(q, { durable: true });
      await channel.bindQueue(q, exchange, q);
    }
    console.log("Bindings done!");
  } catch (error) {
    console.error("❌ Failed to bind exchange", error);
    throw new Error("unreachable");
  }
}
