import amqp from "amqplib";

export async function connectRabbitMQ(RABBITMQ_URL) {
  let channel = null;

  while (!channel) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      console.log("channel value:", channel);
      await channel.assertQueue("stream.jobs", { durable: true });
      console.log("[*] Connected to RabbitMQ");
      return channel;
    } catch (err) {
      console.log("[!] RabbitMQ not ready, retrying in 3s...");
      await new Promise(() => setTimeout(() => {}, 3000));
    }
  }
}
