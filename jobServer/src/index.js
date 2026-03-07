import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectRabbitMQ, verifyStreamKey } from "./support.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT);
const RABBITMQ_URL = process.env.RABBITMQ_URL;

// Connect to RabbitMQ
const channel = connectRabbitMQ(RABBITMQ_URL);

// POST endpoint to enqueue streaming jobs
app.post("/enqueue", async (req, res) => {
  if (!channel) return res.status(503).send("RabbitMQ not ready");

  const { MTX_PATH } = req.body;
  if (!MTX_PATH) return res.status(400).send("Missing fields");

  channel.sendToQueue("stream.jobs", Buffer.from(JSON.stringify(MTX_PATH)), {
    persistent: true,
  });
  console.log(`[+] Job enqueued for stream ${MTX_PATH.split("/")[1]}`);
  res.send({ status: "ok", job });
});

app.post("/auth", async (req, res) => {
  //   {
  //   "user": "user",
  //   "password": "password",
  //   "token": "token",
  //   "ip": "ip",
  //   "action": "publish|read|playback|api|metrics|pprof",
  //   "path": "path",
  //   "protocol": "rtsp|rtmp|hls|webrtc|srt",
  //   "id": "id",
  //   "query": "query"
  // }

  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ error: "Missing keys" });
    }
    const isValid = await verifyStreamKey(user, pass);

    if (!isValid) {
      return res.status(403).json({ error: "Invalid stream key" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Verification failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`[+] Job-server listening on port ${PORT}`);
});
