import type { Request, Response } from "express";
import { instance } from "../../..";
import { PaymentModel } from "../../../models/payments";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
    const { amount, type, message, streamId } = req.body;

    if (!Number.isInteger(Number(amount))) {
      return res.status(400).json({ msg: "Invalid amount format" });
    }
    const amountInPaise = Number(amount) * 100;
    if (amountInPaise < 1000 || amountInPaise > 5000) {
      return res.status(400).json({ msg: "Amount out of bounds" });
    }

    const order = await instance.orders.create({
      amount: `${amount}* 100`,
      currency: "INR",
      notes: {
        type: `${type}`,
        user: `${userId}`,
      },
      receipt: `receipt:${Date.now()}`,
    });

    const transaction = await PaymentModel.create({
      userId,
      amount,
      message,
      streamId,
      status: "PENDING",
      orderId: order.id,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), //6 hrs
    });

    return res.status(200).json({
      success: true,
      order,
      transactionId: transaction._id,
    });
  } catch (err) {
    console.error("Create intent failed:", err);
    return res.status(500).json({
      success: false,
      msg: "Could not create payment intent",
    });
  }
};
