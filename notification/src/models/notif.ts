import mongoose, { Schema, model } from "mongoose";
import { INotification } from "../types/types";

export const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      required: true,
      enum: ["follow", "stream_live", "stream_start", "chat", "like"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ( auto-delete after 7 days)
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 },
);

export const notifyModel: mongoose.Model<INotification> =
  mongoose.models.notification ||
  model<INotification>("notification", notificationSchema);
