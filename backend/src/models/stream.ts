import mongoose, { Schema, model } from "mongoose";
import { IStream } from "@istream/shared";

const StreamSchema = new Schema(
  {
    streamerId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    tags: {
      type: Array<string>,
      index: true, // c,kernel,lld etc
    },

    streamKey: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["live", "ended", "pending", "inactive", "delete-pending"],
      default: "pending",
    },

    VOD_URL: {
      type: String, // R2 URL
      sparse: true,
    },

    isCloud: {
      type: Boolean,
      default: false,
    },

    thumbnail: {
      type: String, // url
      default: "/thumbnail/miku.jpg",
    },

    startedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },

    viewers: {
      type: Number,
      default: 0,
    },

    like: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },
    expiresAt: { type: Date, sparse: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const streamModel: mongoose.Model<IStream> =
  mongoose.models.streams || model<IStream>("streams", StreamSchema);
