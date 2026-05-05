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
import { startSuperchatCron } from "./controller/payment/reconcilliation";
export const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const app = express();
const PORT = process.env.PORT || 4000;
export const payExchange = "payment";
export const server = http.createServer(app); // sharing the same port for now

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true }));
app.use(cookieParser());

initPassport();
app.use(passport.initialize());

// API ENDPOINTS-
app.use("/api/auth", authRouter());
app.use("/api/user", userRouter);
app.use("/api/stream", streamRouter);

const startServer = async () => {
  try {
    // connecting to db
    await dbConnect();

    // connecting to redis
    await redisConnect();

    // rabbitmq Channel + PayExchange(to be asserted in the payment microservice in future)
    const { publishChannel, payChannel } = await connectToRabbitMQ();
    await publishChannel.assertExchange("notification", "direct", {
      durable: true,
    });

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
    startSuperchatCron();

    // await socket.io server connection
    await initSocket(server);

    app.listen(PORT, () => {
      console.log("💻Server started on PORT:", PORT);
    });
  } catch (err) {
    console.error("Failed to start the server:", err);
  }
};

startServer();

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
