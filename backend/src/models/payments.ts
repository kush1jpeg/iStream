import mongoose, { model, Schema, Document } from "mongoose";

export interface IPay extends Document {
  userId: mongoose.Types.ObjectId;
  streamId: mongoose.Types.ObjectId;
  amount: number;
  currency: "INR";
  status: "FAILED" | "SUCCESS" | "PENDING";
  provider: "RazorPay";
  providerPaymentId: string; // TXN-id
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPay>(
  {
    userId: { ref: "users", required: true },
    streamId: { ref: "streams", required: false }, // to work for both shop and superChat
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, required: true },
    provider: { type: String },
    providerPaymentId: { type: String, required: true },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ streamId: 1, createdAt: -1 });

export const PaymentModel: mongoose.Model<IPay> =
  mongoose.models.Payment || model<IPay>("Payments", paymentSchema);
