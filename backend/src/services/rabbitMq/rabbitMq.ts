import amqp, { Channel, ChannelModel } from "amqplib";
import { fork, spawn } from "child_process";
import path from "path";

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
        "-hwaccel",
        "cuda",
        "-hwaccel_output_format",
        "cuda",
        "-i",
        `/hls/raw/${streamName}.m3u8`,
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3];[v1]scale=1920:1080[v1080];[v2]scale=1280:720[v720];[v3]scale=854:480[v480]",
        "-map",
        "[v1080]",
        "-c:v",
        "h264_nvenc",
        "-b:v",
        "3000k",
        "-preset",
        "p5",
        "-maxrate",
        "3500k",
        "-bufsize",
        "6000k",
        `/hls/variants/1080p/${streamName}.m3u8`,
        "-map",
        "[v720]",
        "-c:v",
        "h264_nvenc",
        "-b:v",
        "1500k",
        "-preset",
        "p5",
        "-maxrate",
        "2000k",
        "-bufsize",
        "4000k",
        `/hls/variants/720p/${streamName}.m3u8`,
        "-map",
        "[v480]",
        "-c:v",
        "h264_nvenc",
        "-b:v",
        "800k",
        "-preset",
        "p5",
        "-maxrate",
        "1000k",
        "-bufsize",
        "2000k",
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

// === AUTO-START WORKER CLUSTER ===
export function startWorkerCluster() {
  const workerPath = path.resolve("./worker.ts");

  const workerProcess = fork(workerPath, [], {
    stdio: "inherit",
  });
  console.log("starting the cluster");
  workerProcess.on("exit", (code) => {
    console.error(`Worker cluster exited with code ${code}. Restarting...`);
    setTimeout(startWorkerCluster, 2000); // auto-restart after crash
  });

  console.log("🚀 Transcoding worker cluster started automatically.");
}
