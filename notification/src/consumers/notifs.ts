import { Channel } from "amqplib";
import { notifyModel } from "../models/notif";
import { redisConnect } from "../config/redis";
import { INotification } from "@istream/shared";

export async function consumeNotifs(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString()) as INotification;
        if (!(await redisConnect())) {
          throw new Error("redisClient not connected");
        }
        await notifyModel.create({
          userId: data.userId,
          actorId: data.actorId,
          type: data.type,
        });

        // // sending thru sockets for instant update
        // (await redisClient.publish("notifications", String(data)),
        //   channel.ack(msg));
      } catch (err) {
        console.error("Consumer error:", err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false },
  );
}
