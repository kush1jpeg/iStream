import { Channel, ConsumeMessage } from "amqplib";
import { getPublishChannel } from "../../config/rabbitmq";
import { deleteAllUnderPrefix } from "./deleteAllUnderPrefix";

export async function startDeletionWorker() {
  const channel = await getPublishChannel();

  // prefetch(1) as deletion is slow and I/O heavy. Don't let one worker 
  // spread load across consumers, scalable later by adding worker replicas.

  await channel.prefetch(1);

  channel.consume('delete-vod', (msg) => handleMessage(channel, msg), {
    noAck: false,
  });
  console.log("[vod-deletion] worker triggered");
}

async function handleMessage(channel: Channel, msg: ConsumeMessage | null) {
  if (!msg) return;
  const retryCount = (msg.properties.headers?.["x-retry-count"] as number) ?? 0;
  let streamId: string;
  let prefix: string;

  try {
    const parsed = JSON.parse(msg.content.toString());
    streamId = parsed.vodId;
    prefix = parsed.prefix;
    if (!streamId || !prefix) throw new Error("malformed message payload");
  } catch (err) {
    console.error("[vod-deletion] unparseable message, dead-lettering", err);
    channel.nack(msg, false, false);
    return;
  }

  try {
    await deleteAllUnderPrefix(prefix);
    channel.ack(msg);
  } catch (err) {
    console.error(`[vod-deletion] attempt ${retryCount + 1} failed for ${streamId}`, err);

    if (retryCount + 1 >= 3) {
      // vanish magic.
      // send to a dlq/dlx ; which is for the future
      channel.nack(msg, false, false);
      return;
    }
    channel.nack(msg, false, true);
  }
}