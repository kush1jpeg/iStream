import amqp, { Channel, ChannelModel } from "amqplib";
import { spawn } from "child_process";

const URL = process.env.RABBITMQ_URL;
let connection: ChannelModel;
let channel: Channel;

export async function initRabbitMQ(queueName: string[]) {
  try {
    if (!URL) throw new Error("RabbitMQ URL not provided");
    connection = await amqp.connect(URL);
    channel = await connection.createChannel();

    // Declare durable queue
    for (const quality of queueName) {
      await channel.assertQueue(quality, { durable: true });

      console.log(`🐇RabbitMQ initialized for queue: ${quality}`);
    }
    return { connection, channel };
  } catch (err) {
    console.error("Failed to initialize RabbitMQ:", err);
    throw err;
  }
}

export async function startWorker(queueName: string[]) {
  if (!channel)
    throw new Error("Channel not initialized. Call initRabbitMQ first.");
  channel.prefetch(1); // 1 job per worker at a time
  for (const quality of queueName) {
    channel.consume(quality, (msg) => {
      if (!msg) throw new Error("msg is null");
      const streamName = msg.content.toString();
      console.log("Processing stream:", streamName);

      const ffmpeg = spawn("ffmpeg", [
        "-i",
        `/hls/raw/${streamName}.m3u8`,
        "-map",
        "0:v:0",
        "-b:v:0",
        "3000k",
        "-s:v:0",
        "1920x1080",
        `/hls/variants/1080p/${streamName}.m3u8`,
        "-map",
        "0:v:0",
        "-b:v:1",
        "1500k",
        "-s:v:1",
        "1280x720",
        `/hls/variants/720p/${streamName}.m3u8`,
        "-map",
        "0:v:0",
        "-b:v:2",
        "800k",
        "-s:v:2",
        "1280x480",
        `/hls/variants/480p/${streamName}.m3u8`,
      ]);

      ffmpeg.stderr.on("data", (data) => console.log(data.toString()));
      ffmpeg.on("close", () => {
        console.log("Transcoding finished for:", streamName, quality);
        channel.ack(msg);
      });
    });
  }
}

async function closeRabbit(): Promise<void> {
  await channel?.close();
  await connection?.close();
}
