import mongoose, { Schema, model, Types } from "mongoose";

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
  viewers?: number;
  views?: number;
  // playbackUrl:string,
  createdAt?: Date; // from timestamps
  updatedAt?: Date;
}

const StreamSchema = new Schema(
  {
    streamerId: {
      type: Types.ObjectId,
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

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const streamModel: mongoose.Model<IStream> =
  mongoose.models.streams || model<IStream>("streams", StreamSchema);
