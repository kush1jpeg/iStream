import amqp from "amqplib";

let publishChannel = null;
let connection = null;

export async function connectToRabbitMQ() {
  const RABBITMQ_URL = process.env.RABBITMQ_URL;
  if (!RABBITMQ_URL) throw new Error("RABBITMQ_URL not specified");

  while (true) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      publishChannel = await connection.createConfirmChannel();
      console.log("🔥 Connected to RabbitMQ!");
      return { publishChannel };
    } catch (error) {
      console.error("❌ RabbitMQ not ready, retrying in 3s...", error);
      if (connection) await connection.close().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

export async function getPublishChannel() {
  if (!publishChannel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return publishChannel;
}
