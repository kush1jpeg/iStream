import { Request, Response } from "express";
import crypto from "crypto";
import { PaymentModel } from "../../../models/payments";
import { getPublishChannel } from "../../../config/rabbitmq";
import { userModel } from "../../../models/user";

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        msg: "Missing payment verification fields",
      });
    }

    const transaction = await PaymentModel.findOne({
      orderId: razorpay_order_id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        msg: "Transaction not found",
      });
    }

    if (transaction.status === "SUCCESS") {
      return res.status(200).json({
        success: false,
        msg: "Transaction success",
      });
    }
    const body = `${transaction.orderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex");

    if (!(expectedSignature === razorpay_signature)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid payment signature",
      });
    }
    transaction.status = "SUCCESS";
    transaction.providerPaymentId = razorpay_payment_id;

    const user = await userModel.findByIdAndUpdate(transaction.userId, {
      $addToSet: { Inventory: transaction.itemId },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "user Doesnt exist",
      });
    }

    transaction.email = user.email;
    transaction.expiresAt = null;
    await transaction.save();

    //send the mail for the transaction using notif service
    const channel = await getPublishChannel();
    channel.sendToQueue(
      "payment_queue",
      Buffer.from(JSON.stringify(transaction)),
    );

    return res.status(200).json({
      success: true,
      msg: "Payment verified successfully",
    });
  } catch (err) {
    console.error("Payment verification failed:", err);

    return res.status(500).json({
      success: false,
      msg: "Payment verification failed",
    });
  }
};
