import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { MailTemplates } from "../../services/mailer/mailManager";
import { sendMail } from "./nodeMailer";

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const id = req.id;
    if (!id) {
      return res.status(400).json({ error: "Signup required" });
    }

    const user = await userModel.findById(id).select("email").lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingOtp = await redis.exists(`otp:${user._id}`);
    if (existingOtp) {
      return res.status(400).json({ error: "OTP already sent" });
    }

    const otpgen = Math.floor(100000 + Math.random() * 900000);
    await redis.set(`otp:${user._id}`, otpgen.toString(), "EX", 300); // expiry in 5mins

    await sendMail(MailTemplates.firstStreamOTP(String(otpgen), user.email)); // as id was included
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(500).json({ error: "missing fields" });
    }
    const id = req.id;
    if (!id) {
      return res.status(400).json({ error: "Signup required" });
    }
    const orig_otp = await redis.get(`otp:${id}`);
    if (!orig_otp) {
      return res.status(400).json({ error: "OTP never sent" });
    }
    if (Number(otp) == Number(orig_otp)) {
      await userModel.updateOne({ id }, { isVerified: true });
      await redis.del(`otp:${id}`);
      return res.status(200).json({ message: "OTP verification successfull" });
    } else {
      return res.status(200).json({ message: "wrong OTP " });
    }
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
