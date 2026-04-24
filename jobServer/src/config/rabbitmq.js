import amqp from "amqplib";

export async function connectRabbitMQ(RABBITMQ_URL) {
  while (true) {
    let conn = null;
    try {
      conn = await amqp.connect(RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue("stream.jobs", { durable: true });
      console.log("[*] Connected to RabbitMQ");
      return channel;
    } catch (err) {
      console.log("[!] RabbitMQ not ready, retrying in 3s...", err.message);
      if (conn) await conn.close().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
