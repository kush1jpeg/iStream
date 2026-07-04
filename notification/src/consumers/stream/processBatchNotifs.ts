import { followModel } from "../../models/follow";
import { filterUnsent } from "./filterUnsent";
import { notifyModel } from "../../models/notif";
import Redis from "ioredis";

const BATCH_SIZE = 500;
export async function processBatchInfo(
  lastId: any | null,
  streamerId: string,
  redisPub: Redis,
  redisClient: Redis,
) {
  const query = lastId
    ? { followedId: streamerId, _id: { $gt: lastId } }
    : { followedId: streamerId };
  const followers = await followModel
    .find(query)
    .sort({ _id: 1 })
    .limit(BATCH_SIZE)
    .select("followerId");

  if (followers.length === 0) return;

  const eventKey = `notif:${streamerId}`;

  const alreadySent = await redisClient.smembers(eventKey);
  const alreadySentSet = new Set(alreadySent); // set for 01 lookup

  const notifications = followers.map((f) => ({
    userId: String(f.followerId),
    actorId: String(streamerId),
    type: "stream",
    createdAt: new Date(),
  }));
  // filter to only unsent followers
  const filteredNotifs = filterUnsent(notifications, alreadySentSet);
  let inserted: any = [];
  /*
  doing this cuz - insertMany fails for some then it throws MongoBulkWriteError after trying all 500 so i need it to set dedupe for the ones it inserted successfully
  which mongo returns as err.insertedDocs, rather than jumping straight to the root catch block and doing a nack and requeue the job.
          */
  try {
    inserted = await notifyModel.insertMany(filteredNotifs, {
      ordered: false,
    });
  } catch (err: any) {
    if (err.insertedDocs) {
      // setting the dedupe for the insertedDocs
      inserted = err.insertedDocs;
    } else {
      throw err; // total failure, nothing to salvage, let outer catch retry cleanly
    }
  }

  //setting up redis dedupe key for 500 followers for which the notifs were sent + ttl for them
  const pipeline = redisPub.multi();
  for (const notif of inserted) {
    pipeline.sadd(eventKey, `${notif.userId}`);
    pipeline.publish(`notifications:${notif.userId}`, JSON.stringify(notif));
  }
  pipeline.expire(eventKey, 24 * 60 * 60); // 24 hours
  await pipeline.exec();

  return (lastId = followers[followers.length - 1]._id);
}
