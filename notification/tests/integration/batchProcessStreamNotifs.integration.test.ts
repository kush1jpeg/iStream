import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { RedisMemoryServer } from "redis-memory-server";
import Redis from "ioredis";
import { followModel } from "../../src/models/follow";
import { notifyModel } from "../../src/models/notif";
import { processBatchInfo } from "../../src/consumers/stream/processBatchNotifs";

let mongod: MongoMemoryServer;
let redisServer: RedisMemoryServer;
let redisClient: Redis;
let redisPub: Redis;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  redisServer = new RedisMemoryServer();
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  redisClient = new Redis({ host, port });
  redisPub = new Redis({ host, port });
}, 3000); // first-run binary compilation is slow, budge

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  redisClient.disconnect();
  redisPub.disconnect();
  await redisServer.stop();
});

beforeEach(async () => {
  await followModel.deleteMany({});
  await notifyModel.deleteMany({});
  await redisClient.flushall();
});

const streamerId = new mongoose.Types.ObjectId();
const userA = new mongoose.Types.ObjectId();
const userB = new mongoose.Types.ObjectId();

it("runs the full pipeline: query followers, filter, insert, dedupe, publish", async () => {
  await followModel.create([
    { followedId: streamerId, followerId: userA },
    { followedId: streamerId, followerId: userB },
  ]);

  const result = await processBatchInfo(
    null,
    String(streamerId),
    redisPub,
    redisClient,
  );

  const docs = await notifyModel.find({});
  expect(docs).toHaveLength(2);

  const dedupeSet = await redisClient.smembers(`notif:${streamerId}`);
  expect(dedupeSet.sort()).toEqual([String(userA), String(userB)].sort());
  expect(result).toBeDefined(); // lastId returns
});

it("runs the full pipeline: and checks for dedupe", async () => {
  const streamerId = new mongoose.Types.ObjectId();
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  await followModel.create([
    { followedId: streamerId, followerId: userA },
    { followedId: streamerId, followerId: userB },
  ]);

  const eventKey = `notif:${streamerId}`;
  await redisClient.sadd(eventKey, String(userA));
  await notifyModel.create({
    actorId: streamerId,
    userId: userA,
    type: "stream",
    createdAt: Date.now(),
  });

  const result = await processBatchInfo(
    null,
    String(streamerId),
    redisPub,
    redisClient,
  );

  const docs = await notifyModel.find({});
  expect(docs).toHaveLength(2);

  const dedupeSet = await redisClient.smembers(`notif:${streamerId}`);
  expect(dedupeSet.sort()).toEqual([String(userA), String(userB)].sort());
  expect(result).toBeDefined(); // lastId returns
});

it("still tracks dedupe correctly when one document in the batch is invalid/ throws err", async () => {
  const streamerId = new mongoose.Types.ObjectId();
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  vi.spyOn(notifyModel, "insertMany").mockRejectedValue(
    Object.assign(new Error("simulated partial bulk failure"), {
      insertedDocs: [
        {
          userId: String(userA),
          actorId: String(streamerId),
          type: "stream",
          createdAt: new Date(),
        },
      ],
    }),
  );

  await followModel.create([
    { followedId: streamerId, followerId: userA },
    { followedId: streamerId, followerId: userB },
  ]);

  const result = await processBatchInfo(
    null,
    String(streamerId),
    redisPub,
    redisClient,
  );

  const dedupeSet = await redisClient.smembers(`notif:${streamerId}`);
  // the actual claim: userA (sent) is tracked, userB (lost) is NOT
  expect(dedupeSet).toContain(String(userA));
  expect(dedupeSet).not.toContain(String(userB));
  expect(dedupeSet).toHaveLength(1);
});
