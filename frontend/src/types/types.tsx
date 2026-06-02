export interface IUser {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  followerCount: number;
  followCount: number;
  currentAnimation?: string;
  currentFrame?: string;
  Inventory?: string[];
  lastReadNotificationId?: string;
  isVerified: boolean;
  donations: IPay[];
  streams: IStream[];
  createdAt: string;
  updatedAt: string;
  websiteId?: string;
}

type NotificationType = "follow" | "stream" | "chat" | "like";
export interface INotification {
  type: NotificationType;
  userId: string;
  actorId?: string;
  createdAt: Number;
  _id: string;
}


export interface IStream {
  _id: string;
  streamerId: string;
  title: string;
  description?: string;
  thumbnail: string;
  tags: Array<string>;
  status: "live" | "ended";
  startedAt?: Date;
  endedAt?: Date;
  viewers: number;
  views: number;
  like: number;
  createdAt: Date; // from timestamps
  updatedAt: Date;
}

export interface IStreamRedis {
  streamer: {
    username?: string;
    avatar?: string;
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
  status: "pending" | "live" | "ended";
  viewers: number;
  likes: number;
  views: number;
  createdAt: string;
}

export interface IPay {
  _id: string;
  userId: string;
  username?: string;
  email?: string;
  message?: string;
  amount: number;
  streamId?: string;
  userPfp?: string; // optional snapshot
  itemId?: string;
  currency: "INR";
  status: "FAILED" | "SUCCESS" | "PENDING";
  provider: "RazorPay";
  orderId: string; // TXN-id
  providerPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface ShopItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageURL?: string;
  stickers?: [{
    name: { type: String },
    imageURL: { type: String },
  }],
  active?: boolean;
  type: "animation" | "frame" | "stickerPack" | "sticker"
}

export interface FollowedUser {
  _id: string;
  frame?: string;
  name: string;
  avatarUrl: string;
  StreamURL?: string;
}


