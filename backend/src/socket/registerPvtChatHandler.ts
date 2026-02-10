import { Namespace, Socket } from "socket.io";
import { conversationModel } from "../models/conversation";
import { msgModel } from "../models/msgPvt";

function getRoomId(userId: string, receiverId: string) {
  return ["dm", userId, receiverId].sort().join(":");
}

export function registerPvtChatHandler(io: Namespace, socket: Socket) {
  socket.on("dm:join", async ({ receiverId }) => {
    try {
      const userId = socket.data.userId;
      if (receiverId == userId) return;
      if (!receiverId) return;

      const roomId = getRoomId(userId, receiverId);
      await conversationModel.findOneAndUpdate(
        { conversationKey: roomId, isGroup: false },
        {
          $setOnInsert: {
            // runs only on new docs, if existing does nothing
            participants: [userId, receiverId],
            conversationKey: roomId,
          },
        },
        { upsert: true, new: true }, // return the new document if inserted
      );
      socket.join(roomId);
    } catch (err) {
      console.error("dm:join failed", err);
      socket.emit("dm:error", { code: "DM_JOIN_FAILED" });
    }
  });

  socket.on("dm:send", async ({ receiverId, message }) => {
    try {
      const userId = socket.data.userId;
      if (!receiverId || !message) return;

      const roomId = getRoomId(userId, receiverId);
      const conversation = await conversationModel.findOne({
        conversationKey: roomId,
      });
      if (!conversation) return;
      if (!conversation.participants.some((id) => id.equals(userId))) return;

      const msg = await msgModel.create({
        senderId: userId,
        conversationKey: conversation.conversationKey,
        message,
      });

      socket.to(roomId).emit("dm:message", {
        senderId: userId,
        receiverId,
        message,
      });

      socket.emit("dm:sent", { ok: true });
      conversation.lastMessage = msg.id;
      await conversation.save();
    } catch (err) {
      console.error("dm:send failed", err);
      socket.emit("dm:error", { code: "DM_SEND_FAILED" });
    }
  });

  socket.on("dm:read", async ({ conversationKey }) => {
    try {
      const userId = socket.data.userId;

      await msgModel.updateMany(
        { conversationKey, senderId: { $ne: userId } },
        { $addToSet: { readBy: userId } },
      );

      const conversation = await conversationModel.findById(conversationKey);
      if (!conversation) return;
      if (!conversation.participants.some((id) => id.equals(userId))) return;

      const otherParticipants = conversation.participants.filter(
        (id) => id.toString() !== userId,
      );
      if (!otherParticipants) return;
      otherParticipants.forEach((participantId) => {
        socket
          .to(getRoomId(userId, participantId.toString()))
          .emit("message:read", {
            conversationKey,
            readerId: userId,
          });
      });
    } catch (err) {
      console.error("dm:read failed", err);
      socket.emit("dm:error", { code: "DM_READ_FAILED" });
    }
  });

  socket.on("dm:leave", ({ receiverId }) => {
    if (!receiverId) return;
    const userId = socket.data.userId;
    const roomId = getRoomId(userId, receiverId);
    socket.leave(roomId);
  });
}
