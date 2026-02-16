import mongoose, { Types } from "mongoose";

export interface QueueOTP {
  type: string;
  template: string;
  otp: string;
  email: string;
}

type NotificationType = "follow" | "stream_live" | "chat";
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  type: NotificationType;
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
  ownedAnimation?: Array<string>;
  lastReadNotificationId: Types.ObjectId | null;
}

export interface IStream {
  _id: Types.ObjectId;
  streamerId: Types.ObjectId;
  title: string;
  description?: string;
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
}
