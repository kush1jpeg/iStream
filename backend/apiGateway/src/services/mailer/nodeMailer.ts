import nodemailer from "nodemailer";

const transporterFunc = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

export const sendMail = async (mailOptions: any) => {
  const transporter = await transporterFunc();
  const info = await transporter.sendMail(mailOptions);
  console.log(`📤 Email sent: ${info.messageId}`);
};
