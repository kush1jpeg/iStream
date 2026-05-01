import mongoose, { model, Schema } from "mongoose";

export interface IMsg extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  conversationKey: mongoose.Types.ObjectId;
  message: String;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[];
}

const messageSchema = new Schema(
  {
    senderId: { type: mongoose.Types.ObjectId, ref: "users" },
    conversationKey: {
      type: mongoose.Types.ObjectId,
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

messageSchema.index({ conversationId: 1, timestamp: 1 });

export const msgModel: mongoose.Model<IMsg> =
  mongoose.models.msgPvt || model("msgPvt", messageSchema);
