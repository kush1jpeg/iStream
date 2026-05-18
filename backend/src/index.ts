import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/authRouter";
import { userRouter } from "./routes/userRouter";
import { dbConnect } from "./config/mongoose";
import { redisConnect } from "./config/redis";
import { streamRouter } from "./routes/streamRouter";
import { initSocket } from "./config/socket";
import http from "http";
import { gracefulShutdown } from "./config/shutdown";
import { connectToRabbitMQ } from "./config/rabbitmq";
import { initPassport } from "./services/passportAuth";
import passport from "passport";

import Razorpay from "razorpay";
import { startCron } from "./controller/payment/reconcilliation";
import { start_deadStreamConsumer } from "./controller/stream/deadStreamConsumer";
import { chatRouter } from "./routes/chatRouter";
export const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const app = express();
const PORT = process.env.PORT || 4000;
export const payExchange = "payment";
export const streamExchange = "stream";
export const server = http.createServer(app); // sharing the same port for now

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(cookieParser());

initPassport();
app.use(passport.initialize());

// API ENDPOINTS-
app.use("/api/auth", authRouter());
app.use("/api/user", userRouter);
app.use("/api/stream", streamRouter);
app.use("/api/chat", chatRouter);

const startServer = async () => {
  try {
    // connecting to db
    await dbConnect();

    // connecting to redis
    await redisConnect();

    // rabbitmq Channel + streamExchange + PayExchange(to be asserted inside the payment microservice in future)
    const { publishChannel, payChannel } = await connectToRabbitMQ();
    await publishChannel.assertExchange("notification", "direct", {
      durable: true,
    });

    await publishChannel.assertExchange(streamExchange, "topic", {
      durable: true,
    });
    await payChannel.assertQueue("stream_end", { durable: true });
    await publishChannel.bindQueue("stream_end", streamExchange, "stream.end");

    await payChannel.assertExchange(payExchange, "topic", {
      durable: true,
    });
    await payChannel.assertQueue("payment_superchat", { durable: true });
    await payChannel.bindQueue(
      "payment_superchat",
      payExchange,
      "payment.superchat",
    );
    // reconcilliation job for cleaning up pending/failed payments
    startCron();
    await start_deadStreamConsumer();

    // await socket.io server connection
    console.log("💻Server started of SOCKET.io");

    await initSocket(server);

    server.listen(PORT, () => {
      console.log("💻Server started on PORT:", PORT);
    });
  } catch (err) {
    console.error("Failed to start the server:", err);
  }
};

startServer();

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
