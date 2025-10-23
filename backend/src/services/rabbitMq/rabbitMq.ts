import amqp, { Channel, ChannelModel } from "amqplib";

const URL = process.env.RABBITMQ_URL;
let connection: ChannelModel;
let channel: Channel;

export async function initRabbitMQ(queueName: string) {
  try {
    if (!URL) throw new Error("RabbitMQ URL not provided");
    connection = await amqp.connect(URL);
    channel = await connection.createChannel();

    // Declare durable queue
    await channel.assertQueue(queueName, { durable: true });

    console.log(`RabbitMQ initialized, queue: ${queueName}`);
    return { connection, channel };
  } catch (err) {
    console.error("Failed to initialize RabbitMQ:", err);
    throw err;
  }
}

async function publishStreamJob(streamName: string): Promise<void> {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  const message = JSON.stringify({ streamName, timestamp: Date.now() });
  channel.sendToQueue("transcode_queue", Buffer.from(message), {
    persistent: true,
  });
  console.log("Enqueued stream:", streamName);
}

async function closeRabbit(): Promise<void> {
  await channel?.close();
  await connection?.close();
}
