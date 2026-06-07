import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { redisConnect } from "./config/redis.js";
import { enqueueTasks } from "./controllers/enqueue.js";
import { handleInactive } from "./controllers/handleInactive.js";
import { healthCheck } from "./controllers/healthCheck.js";

const app = express();
app.use(express.json());

const PORT = Number(3000);
const RABBITMQ_URL = process.env.RABBITMQ_URL;
console.log(RABBITMQ_URL);

// Connect to RabbitMQ
await connectRabbitMQ(RABBITMQ_URL);

// POST endpoint to enqueue streaming jobs
app.post("/enqueue", enqueueTasks);

// POST endpoint to alert about disconnect
app.post("/stream-inactive", handleInactive);

app.get("/health", healthCheck);

await redisConnect();

app.listen(PORT, () => {
  console.log(`[+] Job-server listening on port ${PORT}`);
});
