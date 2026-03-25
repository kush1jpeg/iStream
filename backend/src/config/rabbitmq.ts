import amqp, { ConfirmChannel, ChannelModel } from "amqplib";
import { Connection } from "mongoose";

let connection: ChannelModel | null = null;
let publishChannel: ConfirmChannel | null = null;
let payChannel: ConfirmChannel | null = null;

export async function connectToRabbitMQ() {
  const RABBITMQ_URL = "amqp://guest:guest@rabbitmq:5672"; // container name as host
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    if (!connection) throw new Error("unreachable");
    publishChannel = await connection.createConfirmChannel();
    payChannel = await connection.createConfirmChannel();

    console.log("🔥 Connected to RabbitMQ in Docker network!");
    return { publishChannel, payChannel };
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    throw new Error("unreachable");
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
