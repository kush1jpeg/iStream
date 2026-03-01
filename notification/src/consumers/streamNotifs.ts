import { Channel } from "amqplib";
import { INotification } from "../types/types";
import { followModel } from "../models/follow";
import { notifyModel } from "../models/notif";

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

          followers.forEach(async (f) => {
            const payload = await notifyModel.create({
              userId: f.followerId,
              actorId: data.actorId,
              type: "stream_live",
            });
            channel.publish(
              "notification",
              "stream_queue",
              Buffer.from(JSON.stringify(payload)),
            );
          });

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
