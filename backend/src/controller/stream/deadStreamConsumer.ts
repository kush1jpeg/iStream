import { getPublishChannel } from "../../config/rabbitmq";
import { terminateStream } from "../stream/endStream";

export async function start_deadStreamConsumer() {
  const channel = await getPublishChannel();
  channel.prefetch(1);
  channel.consume("stream_end", async (msg) => {
    if (!msg) return;
    console.log("[*] Received message in stream_end queue", msg.content.toString());
    const { streamId, userId } = JSON.parse(msg.content.toString());
    await terminateStream(streamId, userId);
    channel.ack(msg);
  });

  console.log("[+] stream lifecycle consumer started");
}
