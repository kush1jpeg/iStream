import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { redis } from "../../config/redis";
import { getPublishChannel } from "../../config/rabbitmq";
import { exchange } from "../..";
import { QueueOTP } from "../../types/types";

export const sendFirstStreamOTP = async (req: Request, res: Response) => {
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

    const OTPconfig: QueueOTP = {
      type: "otp_queue",
      template: "firstStreamOTP",
      otp: String(otpgen),
      email: user.email,
    };

    const publishChannel = await getPublishChannel();
    if (!publishChannel) {
      throw new Error("Publish channel is empty or undefined!");
    }

    // queueing into rabbitmq;
    publishChannel.publish(
      exchange,
      "otp_queue",
      Buffer.from(JSON.stringify(OTPconfig)),
      { persistent: true }, // survive restart
      (err, ok) => {
        if (err !== null) {
          console.error("Message nacked! by the broker", err);
        } else {
          return res.status(200).json({ message: "OTP sent successfully" });
        }
      },
    );
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
