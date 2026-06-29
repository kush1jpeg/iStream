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
  msg?: string;
  actorId?: string;
  pfp?: string;
  redirect?: string;
  createdAt: Number;
}

export type LogLevel = "err" | "info";
export interface IStreamLog {
  type: LogLevel;
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

export interface IUserFrontend extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  bio: string;
  streams: IStream[];
  donations: IPay[];
  avatar: string;
  banner: string;
  isVerified: boolean; // true if is mail or oauth verified and can stream
  followers?: string[];
  isLive: boolean;
  following?: string[];
  createdAt: Date;
  updatedAt: Date;
  websiteId?: string;
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
  status?: "pending" | "live" | "ended" | "inactive";
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
  streamer: string; // JSON.stringify(IStreamerRedisData)
  stream: string; // JSON.stringify(IStreamRedisData)
  streamerId: string;
  streamId: string;
  streamKey: string;
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
  streamKey?: string;
  HLS_PATH: string;
  inactiveSince: string | null;
  status: "pending" | "live" | "ended" | "inactive";
  viewers: String;
  likes: String;
  views: String;
  createdAt: String;
}

export interface FollowedUser {
  _id: string;
  frame?: string;
  name: string;
  avatarUrl: string;
  StreamURL?: string;
}

export interface IMsg extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  conversationKey: String;
  message: String;
  timestamp: Date;
  readBy: Types.ObjectId[];
}

export interface IShopItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageURL?: string;
  stickers?: [
    {
      name: { type: String };
      imageURL: { type: String };
    },
  ];
  active?: boolean;
  type: "animation" | "frame" | "stickerPack" | "sticker";
}
