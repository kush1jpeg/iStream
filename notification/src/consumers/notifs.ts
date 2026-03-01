import { Channel } from "amqplib";
import { notifyModel } from "../models/notif";
import { redisClient } from "../config/redis";
import { INotification } from "../types/types";

export async function consumeNotifs(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString()) as INotification;
        switch (data.type) {
          case "stream_live":
            break;

          default:
            break;
        }
        await notifyModel.create({
          userId: data.userId,
          actorId: data.actorId,
          type: data.type,
        });

        await redisClient.publish("notifications", JSON.stringify(msg.content));

        channel.ack(msg);
      } catch (err) {
        console.error("Consumer error:", err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false },
  );
}
