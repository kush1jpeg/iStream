import mongoose, { model, Schema } from "mongoose";
import { IUser } from "../types/types";

export const pfpDefaults = [
  "/pfp/reze.jpg",
  "/pfp/monster.jpg",
  "/pfp/mikasa.jpg",
  "/pfp/ido.jpg",
  "/pfp/guts.jpg",
  "/pfp/griff.jpg",
  "/pfp/baldaurs.jpg",
];
const bannerDefaults = [
  "/banner/angel.jpg",
  "/banner/eren.jpg",
  "/banner/goth.jpg",
  "/banner/goth1.jpg",
  "/banner/goth2.jpg",
  "/banner/reze.jpg",
  "/banner/retro.jpg",
];

export function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 1,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
    },
    bio: {
      type: String,
      default:
        "even if he caught him and brought him back to the colony, he would immediately head right back for the mountains, but why?",
    },
    passwordHash: {
      type: String,
      default: null,
    },
    followerCount: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    followCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastReadNotificationId: {
      type: Schema.Types.ObjectId,
      ref: "notifications",
      sparse: true,
    },
    avatar: {
      value: {
        type: String,
        default: () => pickRandom(pfpDefaults),
      },
      isCloud: {
        type: Boolean,
        default: false,
      },
    },

    banner: {
      value: {
        type: String,
        default: () => pickRandom(bannerDefaults),
      },
      isCloud: {
        type: Boolean,
        default: false,
      },
    },
    currentAnimation: {
      type: String,
      sparse: true,
    },
    Inventory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShopItem",
      },
    ],
    currentFrame: {
      type: String,
      sparse: true,
    },
    websiteId: {
      type: String,
      sparse: true,
    },
    twitchId: {
      type: String,
      sparse: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    refreshToken: {
      type: String,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// auto-delete unverified users after 0.5 hour
userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 1800,
    partialFilterExpression: { isVerified: false },
  },
);

export const userModel: mongoose.Model<IUser> =
  mongoose.models.users || model<IUser>("users", userSchema);
