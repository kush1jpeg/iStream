import type { Request, Response } from "express";
import { userModel } from "../models/user.js";
import { sendMail } from "../services/nodeMailer.js";
import { otpModel } from "../models/otp.js";

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await userModel.findOne({ email });
    const isotp = await otpModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User is already verified" });
    }
    if (isotp) {
      return res.status(400).json({ error: "OTP already sent" });
    }

    const otpgen = Math.floor(100000 + Math.random() * 900000);
    const otp = new otpModel({ email, otpgen });

    await otp.save();

    // Send OTP via email
    await sendMail(user.email, otpgen);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { otp, email } = req.body;
    if (!(otp && email)) {
      return res.status(500).json({ error: "missing fields" });
    }
    const orig_otp = await otpModel.findOne({ email });
    if (!orig_otp) {
      return res.status(400).json({ error: "OTP never sent" });
    }
    if (Number(otp) == orig_otp.otp) {
      await userModel.updateOne({ email }, { isVerified: true });
      await otpModel.deleteOne({ email });
      return res.status(200).json({ message: "OTP verification successfull" });
    } else {
      return res.status(200).json({ message: "wrong OTP " });
    }
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
