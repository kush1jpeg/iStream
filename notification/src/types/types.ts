import { Types } from "mongoose";

export interface QueueOTP {
  type: string;
  template: string;
  link?: string;
  otp?: string;
  email: string;
}

type NotificationType = "follow" | "stream" | "chat" | "like";
export interface INotification extends Document {
  userId: Types.ObjectId;
  actorId?: Types.ObjectId;
  type: NotificationType;
  createdAt: Date;
}

export interface IPay extends Document {
  userId: Types.ObjectId;
  username?: string;
  email?: string;
  message?: string;
  amount: number;
  streamId?: Types.ObjectId;
  userPfp?: string; // optional snapshot
  itemId?: Types.ObjectId;
  currency: "INR";
  status: "FAILED" | "SUCCESS" | "PENDING";
  provider: "RazorPay";
  orderId: string; // TXN-id
  providerPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
