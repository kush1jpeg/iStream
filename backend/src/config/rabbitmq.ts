import amqp, { ConfirmChannel, ChannelModel } from "amqplib";

let connection: ChannelModel | null = null;
let publishChannel: ConfirmChannel | null = null;

export async function connectToRabbitMQ() {
  const RABBITMQ_URL = "amqp://guest:guest@rabbitmq:5672"; // container name as host
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    if (!connection) throw new Error("unreachable");
    publishChannel = await connection.createConfirmChannel();
    console.log("🔥 Connected to RabbitMQ in Docker network!");
    return { connection, publishChannel };
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    throw new Error("unreachable");
  }
}

export async function getPublishChannel(): Promise<ConfirmChannel> {
  if (!publishChannel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return publishChannel;
}
// queues = ["payment_queue", "otp_queue", "general_queue"];
