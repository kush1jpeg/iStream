import type { Request, Response } from "express";
import { instance } from "../../..";
import { PaymentModel } from "../../../models/payments";
import { shopItemModel } from "../../../models/item";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
    const { productId } = req.body;
    const product = await shopItemModel.findById(productId);
    if (!product || !productId) return res.json({ msg: "product not found" });
    if (!product.active) return res.json({ msg: "product not available" });
    const amount = Math.round(Number(product.price) * 100);

    const order = await instance.orders.create({
      amount,
      currency: "INR",
      notes: {
        type: `${product.type}`,
        name: `${product.name}`,
      },
      receipt: `receipt:${Date.now()}`,
    });

    const transaction = await PaymentModel.create({
      userId,
      amount: product.price,
      itemId: productId,
      status: "PENDING",
      orderId: order.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //24 hrs
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
