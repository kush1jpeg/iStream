import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { redisClient, redisConnect } from "./config/redis.js";
import { verifyStreamKey } from "./support.js";

const app = express();
app.use(express.json());

const PORT = Number(3000);
const RABBITMQ_URL = process.env.RABBITMQ_URL;
console.log(RABBITMQ_URL);
// Connect to RabbitMQ
const channel = await connectRabbitMQ(RABBITMQ_URL);

// POST endpoint to enqueue streaming jobs
app.post("/enqueue", async (req, res) => {
  console.log("[+] reached enqueue");
  if (!channel) return res.status(503).send("RabbitMQ not ready");

  const { MTX_PATH } = req.body;
  if (!MTX_PATH) return res.status(400).send("Missing fields");
  const streamKey = MTX_PATH.split("/")[1];
  console.log(streamKey);

  if (!(await verifyStreamKey(streamKey))) {
    return res.status(400).send("streamKey Not verified");
  }

  channel.sendToQueue("stream.jobs", Buffer.from(JSON.stringify(MTX_PATH)), {
    persistent: true,
  });
  console.log(`[+] Job enqueued for stream ${streamKey}`);
  res.send({ status: "ok" });
});

await redisConnect();
// for just debugging
console.log("created a test streamkey in redis");
redisClient.set(`streamKey:kush`, "thisIsstreamId");

app.listen(PORT, () => {
  console.log(`[+] Job-server listening on port ${PORT}`);
});
