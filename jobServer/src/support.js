import amqp from "amqplib";

let channel = null;
export async function connectRabbitMQ(RABBITMQ_URL) {
  while (!channel) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log("[*] Connected to RabbitMQ");
    } catch (err) {
      console.log("[!] RabbitMQ not ready, retrying in 3s...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export async function verifyStreamKey(user, pass) {
  // checking redis;
  console.log("stream key is verified :TEST ", user, pass);
  return 1;
}
