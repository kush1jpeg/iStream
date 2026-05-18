import { Channel } from "amqplib";
import { INotification } from "../types/types";
import { followModel } from "../models/follow";
import { notifyModel } from "../models/notif";
import { redisClient, redisConnect } from "../config/redis";

export async function consumeStreamNotifs(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString()) as INotification;
        const streamerId = data.userId;
        let lastId: any = null;
        const BATCH_SIZE = 500;
        if (!(await redisConnect())) {
          throw new Error("redisClient not connected");
        }

        while (true) {
          const query = lastId
            ? { followedId: streamerId, _id: { $gt: lastId } }
            : { followedId: streamerId };

          const followers = await followModel
            .find(query)
            .sort({ _id: 1 })
            .limit(BATCH_SIZE)
            .select("followerId");

          if (followers.length === 0) break;

          const notifications = followers.map((f) => ({
            userId: f.followerId,
            actorId: data.actorId,
            type: "stream",
            createdAt: new Date(),
          }));
          const inserted = await notifyModel.insertMany(
            notifications,
            { ordered: false }, // continue even if some fail
          );
          const pipeline = redisClient.multi();
          for (const notif of inserted) {
            pipeline.publish(`notifications`, JSON.stringify(notif));
          }
          await pipeline.exec();

          lastId = followers[followers.length - 1]._id;
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

// could have added a dlq and dlx but tooo lazy..
