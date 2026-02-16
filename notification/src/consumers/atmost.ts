import { Channel } from "amqplib";

export async function MailconsumeAtMost(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    (msg) => {
      if (msg) {
        console.log(`Received (${queueName}): ${msg.content.toString()}`);
        // no ack, fire-and-forget
      }
    },
    { noAck: true }, // auto ack → at-most-once
  );
}
