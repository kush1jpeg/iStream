import mongoose, { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // users in this chat
  lastMessage?: mongoose.Types.ObjectId; // link to latest msg
  isGroup: boolean; // single or group chat
  groupName?: string; // name if it's group
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
    groupName: { type: String, trim: true },
  },
  { timestamps: true },
);

conversationSchema.index({ groupName: 1 });

conversationSchema.pre("save", async function (next) {
  if (!this.isGroup && this.participants.length === 2) {
    const existing = await mongoose.models.Conversation.findOne({
      participants: { $all: this.participants, $size: 2 },
      isGroup: false,
    });
    if (existing) {
      const err = new Error("Conversation already exists");
      return next(err);
    }
  }
  next();
});

export const conversationModel: mongoose.Model<IConversation> =
  mongoose.models.conversation || model("conversation", conversationSchema);
