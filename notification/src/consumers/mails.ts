import { Channel } from "amqplib";
import { QueueOTP } from "../types/types";
import { sendMail } from "../mailer/nodeMailer";
import { MailTemplates } from "../mailer/mailManager";

export async function consumeOTPMails(queueName: string, channel: Channel) {
  console.log(`Waiting for messages in ${queueName}...`);

  channel.consume(
    queueName,
    async (msg) => {
      if (msg) {
        console.log(`Received msg on (${queueName})`);
        const payload = JSON.parse(msg.content.toString()) as QueueOTP;
        switch (payload.template) {
          case "firstStreamOTP":
            await sendMail(
              MailTemplates.firstStreamOTP(String(payload.otp), payload.email),
            );
            channel.ack(msg);
            break;

          case "forgotPassword":
            await sendMail(
              MailTemplates.forgotPassword(payload.link!, payload.email),
            );
            channel.ack(msg);
            break;

          case "passwordChangeSuccess":
            await sendMail(MailTemplates.passwordChangeSuccess(payload.email));
            channel.ack(msg);
            break;
        }
      }
    },
    { noAck: false },
  );
}
