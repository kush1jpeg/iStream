import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.js";
import { sendMail } from "../services/nodeMailer.js";
import bcrypt from "bcryptjs";
import { jwtkey } from "./register.js";

export const forgotPass = async (req: Request, res: Response) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "email not provided" });
  }
  const user = await userModel.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const resetToken = jwt.sign({ id: user._id }, jwtkey, {
    expiresIn: "15m",
  });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
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
  };
  await sendMail(mailOptions);
  return res.json({ msg: "Reset link sent to email" });
};

export const verifyandChangePass = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const decoded = jwt.verify(token, jwtkey) as { id: string };

  const user = await userModel.findById(decoded.id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ msg: "Password reset successful" });
};

export const resetPass = async (req: Request, res: Response) => {
  try {
    const id = req.id;
    if (!id) return res.status(401).json({ msg: "User not logged in" });

    const { newPass, oldPass } = req.body;
    if (!newPass || !oldPass)
      return res
        .status(400)
        .json({ msg: "Both old and new passwords are required" });

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ msg: "Incorrect old password" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    user.passwordHash = hashedPassword;
    await user.save();

    return res.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error", error });
  }
};
