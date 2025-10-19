import type { Request, Response } from "express";
import { userModel } from "../models/user.js";
import { sendMail } from "../services/nodeMailer.js";
import { otpModel } from "../models/otp.js";

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const id = req.id;

    if (!id) {
      return res.status(400).json({ error: "Signup required" });
    }

    const user = await userModel.findOne({ id });
    const isotp = await otpModel.findOne({ id });

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
    const otp = new otpModel({ id, otpgen });

    await otp.save();

    const mailOptions = {
      from: `"iStream Support" <${process.env.STREAMAIL}>`, // sender
      to: user.email,
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
    await sendMail(mailOptions);

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
    const id = req.user;
    if (!id) {
      return res.status(400).json({ error: "Signup required" });
    }
    const orig_otp = await otpModel.findOne({ id });
    if (!orig_otp) {
      return res.status(400).json({ error: "OTP never sent" });
    }
    if (Number(otp) == orig_otp.otp) {
      await userModel.updateOne({ id }, { isVerified: true });
      await otpModel.deleteOne({ id });
      return res.status(200).json({ message: "OTP verification successfull" });
    } else {
      return res.status(200).json({ message: "wrong OTP " });
    }
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
