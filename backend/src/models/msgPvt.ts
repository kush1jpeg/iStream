import mongoose, { model, Schema } from "mongoose";

export interface IMsg extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: String;
  timestamp: Date;
  read: Boolean;
}

const messageSchema = new Schema({
  senderId: { type: mongoose.Types.ObjectId, ref: "users" },
  conversationId: { type: mongoose.Types.ObjectId, ref: "conversation" },
  message: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

messageSchema.index({ senderId: 1, receiverId: 1 });

export const msgModel: mongoose.Model<IMsg> =
  mongoose.models.msgPvt || model("msgPvt", messageSchema);
