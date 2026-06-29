import mongoose, { Schema, model } from "mongoose";
import { INotification } from "@istream/shared";

export const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    msg: { type: String, required: false },
    pfp: { type: String, required: false },
    redirect: { type: String, required: false },
    type: {
      type: String,
      required: true,
      enum: ["follow", "stream", "chat", "like"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ( auto-delete after 7 days)
notificationSchema.index({ createdAt: 1 }, { expires: 7 * 24 * 60 * 60 });

export const notifyModel: mongoose.Model<INotification> =
  mongoose.models.notification ||
  model<INotification>("notification", notificationSchema);
