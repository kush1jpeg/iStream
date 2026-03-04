import mongoose, { model, Schema } from "mongoose";
import { IPay } from "../types/types";

const paymentSchema = new Schema<IPay>(
  {
    userId: { ref: "users", required: true, type: Schema.Types.ObjectId },
    username: { type: String, required: false, sparse: true },
    amount: { type: Number, required: true },
    streamId: { ref: "streams", required: false, type: Schema.Types.ObjectId }, // for superchat
    itemId: { ref: "shopItem", required: true, type: Schema.Types.ObjectId }, // for shop
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      required: true,
      enum: ["FAILED", "SUCCESS", "PENDING"],
    },
    email: { type: String, sparse: true, required: false },
    message: { type: String, sparse: true, required: false },
    userPfp: { type: String, sparse: true, required: false },
    provider: { type: String },
    orderId: { type: String, required: true },
    providerPaymentId: { type: String, required: false },
    expiresAt: { type: Date, sparse: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ streamId: 1, createdAt: -1 });
paymentSchema.index({ itemId: 1, createdAt: -1 });

export const PaymentModel: mongoose.Model<IPay> =
  mongoose.models.Payments || model<IPay>("Payments", paymentSchema);
