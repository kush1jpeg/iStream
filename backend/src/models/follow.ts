import mongoose, { model, Schema } from "mongoose";

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followedId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    followedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

followSchema.index({ followerId: 1, followedId: 1 }, { unique: true }); // prevent duplicate follows
followSchema.index({ followedId: 1 });

export const followModel: mongoose.Model<IFollow> =
  mongoose.models.follow || model("follow", followSchema);
