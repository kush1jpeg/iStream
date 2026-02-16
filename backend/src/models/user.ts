import mongoose, { model, Schema, Types } from "mongoose";
import { IUser } from "../types/types";

const animeDefaults = [
  // would remove these hotlinks and use cloudflare cdn or cloudinary
  "https://i.waifu.pics/O4gqsyo.jpg",
  "https://i.pinimg.com/736x/14/12/1e/14121e4fc25bf3087435eb608fc717eb.jpg",
  "https://i.pinimg.com/736x/b9/2a/0f/b92a0f162d14844ce4fa7ab233f97dc8.jpg",
  "https://i.pinimg.com/1200x/f2/b1/18/f2b1186b3a7dea42ec93364674cf0f29.jpg",
  "https://i.pinimg.com/736x/45/7a/07/457a07d796872e64b2447c13fc7adb6a.jpg",
  "https://i.pinimg.com/736x/ee/8e/50/ee8e50595f217b35bdf417969e4663dd.jpg",
];

function pickRandom(arr: string[]) {
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
    },
    followCount: {
      type: Number,
      required: true,
      default: 0,
    },
    lastReadNotificationId: {
      type: Schema.Types.ObjectId,
      ref: "notifications",
      sparse: true,
    },
    avatar: {
      type: String,
      default: pickRandom(animeDefaults),
    },
    banner: {
      type: String,
      default: pickRandom(animeDefaults),
    },
    currentAnimation: {
      type: String,
      sparse: true,
    },
    ownedAnimation: {
      type: Array,
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
  },
  {
    timestamps: true,
  },
);

export const userModel: mongoose.Model<IUser> =
  mongoose.models.users || model<IUser>("users", userSchema);
