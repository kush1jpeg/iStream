import amqp from "amqplib";

let conn = null;
let channel = null;

export async function connectRabbitMQ(RABBITMQ_URL) {
  while (true) {
    try {
      const nextConn = await amqp.connect(RABBITMQ_URL);
      const nextChannel = await nextConn.createChannel();

      conn = nextConn;
      channel = nextChannel;

      nextConn.on("error", (err) => {
        console.error("[RabbitMQ] connection error:", err);
      });
      nextConn.on("close", () => {
        console.error("[RabbitMQ] connection closed");
        if (conn === nextConn) conn = null;
        if (channel === nextChannel) channel = null;
      });

      nextChannel.on("error", (err) => {
        console.error("[RabbitMQ] channel error:", err);
      });
      nextChannel.on("close", () => {
        console.error("[RabbitMQ] channel closed");
        if (channel === nextChannel) channel = null;
      });

      await nextChannel.assertQueue("stream.jobs", { durable: true });
      console.log("✅ Connected to RabbitMQ");
      return nextChannel;
    } catch (err) {
      console.log("[!] RabbitMQ not ready, retrying in 3s...", err.message);
      if (conn) await conn.close().catch(() => {});
      conn = null;
      channel = null;
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
  if (!conn || !channel) return false;
  try {
    await channel.checkQueue("stream.jobs");
    return true;
  } catch {
    return false;
  }
}
