import express from "express";
import { bindExchange, connectToRabbitMQ } from "./config/rabbitmq";
import { MailconsumeAtLeast } from "./consumers/atleast";
import { MailconsumeAtMost } from "./consumers/atmost";

const app = express();
const PORT = process.env.PORT || 4001;
app.use(express.json());

const slowQueue = ["payment_queue", "otp_queue"];
const fastQueue = ["general_queue"];

const startServer = async () => {
  try {
    const { connection } = await connectToRabbitMQ();

    const fastChannel = await connection.createChannel();
    await bindExchange(fastChannel, "notification", fastQueue);
    await MailconsumeAtMost("general_queue", fastChannel);

    const slowChannel = await connection.createChannel();
    await bindExchange(slowChannel, "notification", slowQueue);
    await MailconsumeAtLeast("otp_queue", slowChannel);
    await MailconsumeAtLeast("payment_queue", slowChannel);

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
