import { Types } from "mongoose";

export interface QueueOTP {
  type: string;
  template: string;
  link?: string;
  otp?: string;
  email: string;
}

type NotificationType =
  | "follow"
  | "stream_start"
  | "stream_live"
  | "chat"
  | "like";
export interface INotification extends Document {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: NotificationType;
  createdAt: Date;
}
