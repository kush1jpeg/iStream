import { getPublishChannel } from "../../config/rabbitmq";
import { redis } from "../../config/redis";
import { terminateStream } from "./endStream";

export async function start_deadStreamConsumer() {
  const channel = await getPublishChannel();
  channel.prefetch(1);
  channel.consume("stream_end", async (msg) => {
    if (!msg) return;
    console.log(
      "[*] Received message in stream_end queue",
      msg.content.toString(),
    );
    const { streamId, userId } = JSON.parse(msg.content.toString());
    await terminateStream(streamId, userId);
    channel.ack(msg);
  });

  console.log("[+] stream lifecycle consumer started");
}

async function pushToTerminateStream(streamId: string, userId: string) {
  const channel = await getPublishChannel();
  console.log("[*] publishing to stream_end queue: [autoscaler] ", {
    streamId,
    userId,
  });
  channel.publish(
    "stream",
    "stream.end",
    Buffer.from(JSON.stringify({ streamId, userId })),
    { persistent: true },
  );
}

const INACTIVE_GRACE_MS = 10 * 60 * 1000; // 10 min
const POLL_INTERVAL_MS = 30_000;

export const startStreamHealthPoller = () => {
  setInterval(async () => {
    try {
      const streamIds = await redis.smembers("live:streams");
      if (!streamIds.length) return;

      for (const streamId of streamIds) {
        const streamData = await redis.hgetall(`stream:${streamId}`);
        if (!streamData) {
          // ghost entry — remove from set
          await redis.srem("live:streams", streamId);
          continue;
        }

        // Single source of truth: does the lease key still exist?
        const isLiveOrPending =
          streamData.status === "live" || streamData.status === "pending";
        const leaseExists = await redis.exists(
          `streamKey:${streamData.streamKey}`,
        );

        if (isLiveOrPending && !leaseExists) {
          // just dropped - mark inactive
          await redis.hset(`stream:${streamId}`, {
            status: "inactive",
            inactiveSince: Date.now().toString(),
          });
          console.log(`[poller] ${streamId} → inactive`);
          continue;
        }

        if (streamData.status === "inactive") {
          if (
            shouldEndStream(
              Number(streamData.inactiveSince),
              Date.now(),
              INACTIVE_GRACE_MS,
            )
          ) {
            const pipeline = redis.pipeline();
            pipeline.hset(`stream:${streamId}`, {
              status: "ended",
              endedAt: Date.now().toString(),
            });
            pipeline.srem("live:streams", streamId);
            await pipeline.exec();

            // push to streamEnd queue
            await pushToTerminateStream(streamId, streamData.streamerId);
            console.log(`[poller] ${streamId} → ended, pushed to queue`);
          }
        }
      }
    } catch (err) {
      console.error("[poller] error:", err);
    }
  }, POLL_INTERVAL_MS);
};

export function shouldEndStream(
  inactiveSince: number,
  now: number,
  graceMs: number,
): boolean {
  return now - inactiveSince >= graceMs;
}

