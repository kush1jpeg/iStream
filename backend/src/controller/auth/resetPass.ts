import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { userModel } from "../../models/user.js";
import { sendMail } from "../../services/mailer/nodeMailer.js";
import { MailTemplates } from "../../services/mailer/mailManager.js";
import { redis } from "../../config/redis.js";

//{** outside the app **}
export const forgotPass = async (req: Request, res: Response) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "email not provided" });
  }
  const user = await userModel.findOne({ email }).select({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const resetToken = crypto.randomUUID();
  await redis.set(`reset:${resetToken}`, String(user._id), "EX", 900); // expire in 15 minutes

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendMail(MailTemplates.forgotPassword(resetLink, email));
  return res.json({ msg: "Reset link sent to email", token: resetToken });
};

export const verifyandChangePass = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const id = await redis.get(`reset:${token}`);
  if (!id) return res.status(400).json({ msg: "Token invalid or expired" });
  await redis.del(`reset:${token}`);

  const user = await userModel.findById(id);
  if (!user) return res.status(404).json({ msg: "User not found" });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.isVerified = false;
  await user.save();
  await sendMail(MailTemplates.passwordChangeSuccess_Template(user.email));
  return res.json({ msg: "Password reset successful" });
};

// {** for inside the app **}
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
    if (!user || !user.passwordHash)
      return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ msg: "Incorrect old password" });

    const hashedPassword = await bcrypt.hash(newPass, 10);
    user.passwordHash = hashedPassword;

    // to do a reverify after passChange
    user.isVerified = false;
    await user.save();

    await sendMail(MailTemplates.passwordChangeSuccess_Template(user.email));

    return res.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error", error });
  }
};
