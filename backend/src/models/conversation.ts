import mongoose, { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // users in this chat
  lastMessage?: mongoose.Types.ObjectId; // link to latest msg
  isGroup: boolean; // single or group chat
  groupName?: string; // name if it's group
  conversationKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      { type: mongoose.Types.ObjectId, ref: "users", required: true },
    ],
    lastMessage: { type: mongoose.Types.ObjectId, ref: "msgPvt" },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true, sparse: true },
    conversationKey: { type: String, trim: true, unique: true },
  },
  { timestamps: true },
);

conversationSchema.index({ groupName: 1 });

export const conversationModel: mongoose.Model<IConversation> =
  mongoose.models.conversation || model("conversation", conversationSchema);
