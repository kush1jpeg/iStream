import { Channel } from "amqplib";
import { sendMail } from "../mailer/nodeMailer";
import { MailTemplates } from "../mailer/mailManager";

export async function consumePayments(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        sendMail(MailTemplates.purchaseNotification(data));
        channel.ack(msg);
      } catch (err) {
        console.error("Consumer error:", err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false },
  );
}

// create a ledger service which would cut a % of money and then send the remaining amount to the creator Razorpay Fund Account
