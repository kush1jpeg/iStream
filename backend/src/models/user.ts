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
    isVerified: {
      type: Boolean,
      default: false,
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true, // allows nulls for non-streamers
    },
    followers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    following: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const userModel: mongoose.Model<IUser> =
  mongoose.models.User || model<IUser>("User", userSchema);
