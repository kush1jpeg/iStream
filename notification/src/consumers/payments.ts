import { Channel } from "amqplib";

export async function consumePayments(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (msg) {
        console.log(`Received (${queueName})`);
      }
    },
    { noAck: false },
  );
}
