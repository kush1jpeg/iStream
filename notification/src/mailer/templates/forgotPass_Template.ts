export const forgotPass_Template = (resetLink: string, email: string) => ({
  from: `"iStream Support" <${process.env.STREAMAIL}>`,
  to: email,
  subject: "Reset Your iStream Password",
  text: `Hello!\n\nWe received a request to reset your iStream account password.\n\nYou can reset your password by clicking the link below:\n${resetLink}\n\nThis link is valid for 10 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\n— iStream Team`,
  html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #0b72b9;">iStream Password Reset</h2>
      <p>Hello,</p>
      <p>We received a request to reset your iStream password.</p>
      <p>You can reset it by clicking the button below:</p>
      <a href="${resetLink}" 
         style="display: inline-block; padding: 10px 20px; margin-top: 10px; background-color: #0b72b9; color: #fff; text-decoration: none; border-radius: 5px;">
         Reset Password
      </a>
      <p style="margin-top: 15px;">If the button above doesn't work, copy and paste the following link into your browser:</p>
      <p><a href="${resetLink}" style="color: #0b72b9;">${resetLink}</a></p>
      <p>This link will expire in 10 minutes.</p>
      <hr>
      <p style="font-size: 12px; color: #777;">If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #777;">© ${new Date().getFullYear()} iStream. All rights reserved.</p>
    </div>
  `,
});
