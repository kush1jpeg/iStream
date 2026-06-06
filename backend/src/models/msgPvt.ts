import mongoose, { model, Schema } from "mongoose";
import type { IMsg } from "@istream/shared";

const messageSchema = new Schema(
  {
    senderId: { type: mongoose.Types.ObjectId, ref: "users" },
    conversationKey: {
      type: String,
      ref: "conversation",
      unique: false,
    },
    message: { type: String },
    readBy: [{ type: mongoose.Types.ObjectId, ref: "users" }],
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversationKey: 1, timestamp: 1 });

export const msgModel: mongoose.Model<IMsg> =
  mongoose.models.msgPvt || model("msgPvt", messageSchema);
