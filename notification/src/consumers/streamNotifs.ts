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
            type: "stream_live",
            createdAt: new Date(),
          }));
          const inserted = await notifyModel.insertMany(
            notifications,
            { ordered: false }, // continue even if some fail
          );

          if (!(await redisConnect())) {
            throw new Error("redisClient not connected");
          }
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
        channel.nack(msg, false, true);
      }
    },
    { noAck: false },
  );
}
