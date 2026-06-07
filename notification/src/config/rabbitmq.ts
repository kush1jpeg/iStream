import amqp, { Channel, ChannelModel, ConfirmChannel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;

export async function connectToRabbitMQ() {
  const RABBITMQ_URL = "amqp://guest:guest@rabbitmq:5672"; // container name as host
  while (true) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createConfirmChannel();
      console.log("🔥 Connected to RabbitMQ in Docker network!");
      return { connection };
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error);
      throw new Error("unreachable");
    }
  }
}

export async function checkRabbitMQ() {
  if (!connection || !channel) return false;
  try {
    await channel.checkQueue("like_queue");
    return true;
  } catch {
    return false;
  }
}

export async function getNotifyChannel(): Promise<ConfirmChannel> {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return channel;
}

export async function bindExchange(
  channel: Channel,
  exchange: string,
  queues: Array<string>,
) {
  try {
    for (let q of queues) {
      const routingKey = q.split("_")[0];
      await channel.assertQueue(q, { durable: true });
      await channel.bindQueue(q, exchange, routingKey);
    }
    console.log("Bindings done!");
  } catch (error) {
    console.error("❌ Failed to bind exchange", error);
    throw new Error("unreachable");
  }
}
