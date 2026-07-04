import { getChannel } from "../config/rabbitmq.js";

export async function pushToTerminateStream(streamId, userId) {
  const channel = await getChannel();
  console.log("[*] publishing to stream_end queue for stream:", {
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
