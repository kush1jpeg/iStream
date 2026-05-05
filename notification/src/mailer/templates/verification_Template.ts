export const firstStreamOTP_Template = (otp: string, email: string) => ({
  from: `"iStream" <kush1jpeg>`,
  to: email,
  subject: "Verify to Go Live on iStream",
  text: `You're almost live!\n\nTo start streaming on iStream for the first time, please verify your identity using the OTP below:\n\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not attempt to start a stream, please secure your account immediately.\n\n— iStream Security`,
  html: `
    <div style="font-family: Arial, sans-serif; color:#333;">
      <h2 style="color:#9146FF;">Confirm Before Going Live 🎥</h2>

      <p>You’re starting your <strong>first stream</strong> on iStream.</p>
      <p>For security, please verify using the one-time password below:</p>

      <div style="
        margin: 20px 0;
        padding: 15px;
        background: #f3f0ff;
        border-radius: 8px;
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 6px;
        text-align: center;
        color: #9146FF;
      ">
        ${otp}
      </div>

      <p>This OTP is valid for <strong>5 minutes</strong>.</p>

      <p>If this wasn’t you, we recommend changing your password immediately.</p>

      <hr />

      <p style="font-size:12px;color:#777;">
        © ${new Date().getFullYear()} iStream · Security Team
      </p>
    </div>
  `,
});
