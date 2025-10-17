import mongoose, { Schema, Document, model } from "mongoose";

interface IOtp extends Document {
  email: string;
  otp: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: 600 } }, // 10 minutes TTL
});

export const otpModel: mongoose.Model<IOtp> =
  mongoose.models.Otp || model<IOtp>("Otp", otpSchema);
