import { Channel } from "amqplib";
import { INotification } from "@istream/shared";
import { redisClient, redisConnect, redisPub } from "../config/redis";
import { processBatchInfo } from "./stream/processBatchNotifs";

export async function consumeStreamNotifs(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString()) as INotification;
        const streamerId = data.userId;
        console.log("streamerId", streamerId);
        let lastId: any = null;
        if (!(await redisConnect())) {
          throw new Error("redisClient not connected");
        }

        while (true) {
          lastId = await processBatchInfo(
            lastId,
            String(streamerId),
            redisPub,
            redisClient,
          );
          if (!lastId) break;
        }
        channel.ack(msg);
      } catch (err) {
        console.error("Consumer error:", err);
        const retryCount = msg.properties.headers?.["x-retry-count"] ?? 0;
        if (retryCount >= 3) {
          channel.nack(msg, false, false);
        } else {
          setTimeout(
            () => {
              channel.publish("", queueName, msg.content, {
                headers: { "x-retry-count": retryCount + 1 },
                persistent: true,
              });
            },
            Math.pow(2, retryCount) * 5000,
          ); // 5s, 10s, 20s
          channel.nack(msg, false, false);
        }
      }
    },
    { noAck: false },
  );
}

// could have added a dlq and dlx but tooo lazy..will add later;
