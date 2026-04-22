import amqp from "amqplib";
import { logger } from "../index.js";

let conn = null;
let channel = null;

export async function connectRabbitMQ(RABBITMQ_URL, QUEUE_NAME) {
  while (true) {
    try {
      conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      logger.info("[*] Connected to RabbitMQ");
      return channel;
    } catch (err) {
      logger.error("[!] RabbitMQ not ready, retrying in 3s...", err.message);
      if (conn) await conn.close().catch(() => {});
      await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    }
  }
}

export async function terminateRabbitMQ() {
  await channel?.close().catch(() => {});
  await conn?.close().catch(() => {});
}
