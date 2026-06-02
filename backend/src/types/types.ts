import { Types } from "mongoose";

export interface QueueOTP {
  type: string;
  template: string;
  link?: string;
  otp?: string;
  email: string;
} // using this for both otp and password reset mail;

type NotificationType = "follow" | "stream" | "chat" | "like";
export interface INotification {
  type: NotificationType;
  userId: Types.ObjectId;
  actorId?: string;
  createdAt: Number;
}

export interface IStreamLog {
  type: NotificationType;
  msg: string;
  userId: string;
  createdAt: Date;
}

interface IUserImage {
  value: string;
  isCloud: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  bio: string;
  passwordHash: string | null;
  avatar: IUserImage;
  banner: IUserImage;
  isVerified: boolean; // true if is mail or oauth verified and can stream
  followers?: string[];
  isLive: boolean;
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
  isCloud: boolean;
  tags: Array<string>;
  streamKey: string;
  VOD_URL?: string;
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

export interface IStreamerRedisData {
  username: string;
  avatar: string;
  frame?: string;
  animation?: string;
}

export interface IStreamRedisData {
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
}
export interface IStreamRedis {
  streamer: string; // JSON.stringify(IStreamerData)
  stream: string; // JSON.stringify(IStreamData)
  streamerId: string;
  streamId: string;
  HLS_PATH: string;
  inactiveSince: string;
  status: "pending" | "live" | "ended" | "inactive";
  viewers: string;
  likes: string;
  views: string;
  createdAt: string;
}

export interface IStreamRedisFrontend {
  streamer: {
    username: string;
    avatar: string;
    frame?: string;
    animation?: string;
  };
  stream: {
    title: string;
    description: string;
    thumbnail: string;
    tags: string[];
  };
  streamerId: string;
  streamId: string;
  HLS_PATH: string;
  inactiveSince: string | null;
  status: "pending" | "live" | "ended" | "inactive";
  viewers: String;
  likes: String;
  views: String;
  createdAt: String;
}
