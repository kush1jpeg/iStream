import mongoose, { model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string; // flickr link
  isVerified: boolean; // true if is mail or oauth verified and can stream
  streamKey?: string; // unique key to broadcast RTMP
  followers?: string[];
  following?: string[];
  createdAt: Date;
  updatedAt: Date;
  googleId?: string;
  twitchId?: string;
  twitchAccessToken?: string;
  googleAccessToken?: string;
  isStreaming: boolean;
  followerCount: Number;
  followCount: Number;
}
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 1,
      maxlength: 10,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
    },
    passwordHash: {
      type: String,
      required: true,
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
    avatar: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      sparse: true,
    },
    twitchId: {
      type: String,
      sparse: true,
    },
    twitchAccessToken: {
      type: String,
      sparse: true,
    },
    googleAccessToken: {
      type: String,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true, // allows nulls for non-streamers
    },
    isStreaming: {
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
