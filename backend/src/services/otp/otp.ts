import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { redis } from "../../config/redis";
import { getPublishChannel } from "../../config/rabbitmq";
import { QueueOTP } from "../../types/types";

// services/otp.service.ts
export const sendOTP = async (userId: string): Promise<void> => {
  const user = await userModel.findById(userId).select("email").lean();
  if (!user) throw new Error("USER_NOT_FOUND");

  const existing = await redis.exists(`otp:${userId}`);
  if (existing) throw new Error("OTP_ALREADY_SENT");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${userId}`, otp, "EX", 300);

  const publishChannel = await getPublishChannel();
  if (!publishChannel) throw new Error("CHANNEL_UNAVAILABLE");

  await publishChannel.assertQueue("otp_queue", { durable: true });

  const payload: QueueOTP = {
    type: "otp_queue",
    template: "firstStreamOTP",
    otp,
    email: user.email,
  };

  publishChannel.sendToQueue(
    "otp_queue",
    Buffer.from(JSON.stringify(payload)),
    { persistent: true },
  );
};

export const sendOTPController = async (req: Request, res: Response) => {
  const userId = req.id;

  if (!userId) {
    return res.status(400).json({ success: false, message: "signup required" });
  }

  try {
    await sendOTP(userId);
    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      OTP_ALREADY_SENT: 429,
      CHANNEL_UNAVAILABLE: 503,
    };
    return res.status(statusMap[err.message] || 500).json({
      success: false,
      message: err.message,
    });
  }
};
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const id = req.id;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP required" });
    }

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "signup required" });
    }

    const storedOTP = await redis.get(`otp:${id}`);

    if (!storedOTP) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or never sent" });
    }

    if (otp !== storedOTP) {
      return res.status(400).json({ success: false, message: "invalid OTP" });
    }

    await userModel.updateOne({ _id: id }, { isVerified: true });
    await redis.del(`otp:${id}`);

    return res.status(200).json({ type: "SUCCESS", message: "email verified" });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};
