import mongoose, { Schema, model } from "mongoose";
import { IStream } from "../types/types";

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

    streamKeyHash: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["live", "ended", "pending"],
      default: "pending",
    },

    // playbackUrl: {
    //   type: String, // HLS/DASH URL
    // },

    thumbnail: {
      type: String, // url
      default: "https://in.pinterest.com/pin/345510602689258975/",
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
