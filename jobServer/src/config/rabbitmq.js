import amqp from "amqplib";

let conn = null;
let channel = null;

export async function connectRabbitMQ(RABBITMQ_URL) {
  while (true) {
    try {
      conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue("stream.jobs", { durable: true });
      console.log("✅ Connected to RabbitMQ");
      return channel;
    } catch (err) {
      console.log("[!] RabbitMQ not ready, retrying in 3s...", err.message);
      if (conn) await conn.close().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

export async function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return channel;
}

export async function checkRabbitMQ() {
  if (!conn) return false;
  try {
    await channel.checkQueue("like_queue");
    return true;
  } catch {
    return false;
  }
}
