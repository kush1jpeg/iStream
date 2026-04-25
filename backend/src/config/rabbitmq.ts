import amqp, { ConfirmChannel, ChannelModel } from "amqplib";

let connection: ChannelModel | null = null;
let publishChannel: ConfirmChannel | null = null;
let payChannel: ConfirmChannel | null = null;

export async function connectToRabbitMQ() {
  const RABBITMQ_URL = process.env.RABBITMQ_URL;
  if (!RABBITMQ_URL) throw new Error("RABBITMQ_URL not specified");

  while (true) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      publishChannel = await connection.createConfirmChannel();
      payChannel = await connection.createConfirmChannel();
      console.log("🔥 Connected to RabbitMQ!");
      return { publishChannel, payChannel };
    } catch (error) {
      console.error("❌ RabbitMQ not ready, retrying in 3s...", error);
      if (connection) await connection.close().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

export async function getPayChannel(): Promise<ConfirmChannel> {
  if (!payChannel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return payChannel;
}

export async function getConnection(): Promise<ChannelModel> {
  if (!connection) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return connection;
}

export async function getPublishChannel(): Promise<ConfirmChannel> {
  if (!publishChannel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return publishChannel;
}

export async function connectToQueues(channel: ConfirmChannel) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }

  await channel.assertQueue("like_queue", { durable: true });
  await channel.bindQueue("like_queue", "notification", "like");

  await channel.assertQueue("follow_queue", { durable: true });
  await channel.bindQueue("follow_queue", "notification", "follow");

  await channel.assertQueue("stream_queue", { durable: true });
  await channel.bindQueue("stream_queue", "notification", "stream");

  await channel.assertQueue("chat_queue", { durable: true });
  await channel.bindQueue("chat_queue", "notification", "chat");
}
