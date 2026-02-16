import { Channel } from "amqplib";
import { QueueOTP } from "../types/types";
import { sendMail } from "../mailer/nodeMailer";
import { MailTemplates } from "../mailer/mailManager";

export async function MailconsumeAtLeast(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString()) as QueueOTP;
        switch (payload.template) {
          case "firstStreamOTP":
            await sendMail(
              MailTemplates.template(String(payload.otp), payload.email),
            );
            channel.ack(msg);
        }
      }
    },
    { noAck: false },
  );
}
