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
  | "stream_live"
  | "stream_start"
  | "chat"
  | "log"
  | "like";
export interface INotification extends Document {
  type: NotificationType;
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  createdAt: Date;
}

export interface IStreamLog {
  type: NotificationType;
  msg: string;
  streamId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  bio: string;
  passwordHash: string | null;
  avatar: string;
  banner: string;
  isVerified: boolean; // true if is mail or oauth verified and can stream
  followers?: string[];
  following?: string[];
  createdAt: Date;
  updatedAt: Date;
  googleId?: string;
  twitchId?: string;
  websiteId?: string;
  refreshToken: string | null;
  followerCount: Number;
  followCount: Number;
  currentAnimation?: string; // to store shopped animation sprite next to livestream and profile
  currentFrame?: string; // to store shopped frames
  Inventory?: Array<Types.ObjectId>;
  lastReadNotificationId: Types.ObjectId | null;
}

export interface IStream {
  _id: Types.ObjectId;
  streamerId: Types.ObjectId;
  title: string;
  description?: string;
  thumbnail: string;
  tags: Array<string>;
  streamKeyHash: string;
  status?: "pending" | "live" | "ended";
  startedAt?: Date;
  endedAt?: Date;
  viewers: number;
  views: number;
  like: number;
  // playbackUrl:string,
  createdAt?: Date; // from timestamps
  updatedAt?: Date;
  expiresAt: Date | null;
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
  expiresAt: Date | null;
}
