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

export const sendMail = async (senderEmail: string, otp: number) => {
  const mailOptions = {
    from: `"iStream Support" <${process.env.SMTP_USER}>`, // sender
    to: senderEmail,
    subject: "iStream Verification OTP",
    text: `Hello!\n\nYour OTP for iStream verification is: ${otp}\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n— iStream Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0b72b9;">iStream Verification</h2>
        <p>Hello,</p>
        <p>Your OTP for verifying your account is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #0b72b9;">${otp}</p>
        <p>This OTP was requested at ${new Date().toUTCString()}.</p> 
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #777;">© 2025 iStream. All rights reserved.</p>
      </div>
    `,
  };

  const transporter = await transporterFunc();
  const info = await transporter.sendMail(mailOptions);
  console.log(`📤 Email sent: ${info.messageId}`);
};
