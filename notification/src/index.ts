import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { bindExchange, connectToRabbitMQ } from "./config/rabbitmq";
import { consumeNotifs } from "./consumers/notifs";
import { consumeOTPMails } from "./consumers/mails";
import { consumePayments } from "./consumers/payments";
import { dbConnect } from "./config/mongoose";
import { redisConnect } from "./config/redis";
import { consumeStreamNotifs } from "./consumers/streamNotifs";

const app = express();
const PORT = process.env.PORT || 4001;
app.use(express.json());

const notifyQueue = [
  "follow_queue",
  "like_queue",
  "stream_queue",
  "chat_queue", // for pvt chats
];

const startServer = async () => {
  try {
    const { connection } = await connectToRabbitMQ();

    const notifyChannel = await connection.createChannel();

    await notifyChannel.assertExchange("notification", "direct", {
      durable: true,
    });
    await bindExchange(notifyChannel, "notification", notifyQueue); // binding to routing keys

    await consumeStreamNotifs("stream_queue", notifyChannel); // notify about stream start to followers
    await consumeNotifs("follow_queue", notifyChannel);
    await consumeNotifs("like_queue", notifyChannel);
    await consumeNotifs("chat_queue", notifyChannel);

    const slowChannel = await connection.createChannel();

    await slowChannel.assertQueue("otp_queue", { durable: true });
    console.log("otp_queue is init");
    await consumeOTPMails("otp_queue", slowChannel);

    await slowChannel.assertQueue("payment_queue", { durable: true });
    await slowChannel.assertExchange("payment", "topic", {
      durable: true,
    });
    await slowChannel.bindQueue("payment_queue", "payment", "payment.*"); // binding to routing keys
    await consumePayments("payment_queue", slowChannel);

    slowChannel.prefetch(1);
    notifyChannel.prefetch(10);

    await dbConnect();

    await redisConnect();

    app.listen(PORT, () => {
      console.log("💻Server started on PORT:", PORT);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received. Closing RabbitMQ...");
      await connection.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Closing RabbitMQ...");
      await connection.close();
      process.exit(0);
    });
  } catch (err) {
    console.error("Failed to start the server:", err);
  }
};
startServer();
