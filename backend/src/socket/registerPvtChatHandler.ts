import { Namespace, Socket } from "socket.io";
import { conversationModel } from "../models/conversation";
import { msgModel } from "../models/msgPvt";

function getRoomId(userId: string, receiverId: string) {
  return [userId, receiverId].sort().join(":");
}

export function registerPvtChatHandler(io: Namespace, socket: Socket) {
  socket.on("dm:join", async ({ receiverId }) => {
    console.log("📥 dm:join received:", {
      receiverId,
      userId: socket.data.userId,
    });
    try {
      const userId = socket.data.userId;
      if (receiverId == userId) {
        console.log("❌ dm:join: receiverId === userId");
        return;
      }
      if (!receiverId) {
        console.log("❌ dm:join: receiverId missing");
        return;
      }

      const roomId = getRoomId(userId, receiverId);
      await conversationModel.findOneAndUpdate({
        conversationKey: roomId,
        isGroup: false,
      });
      socket.join(roomId);
    } catch (err) {
      console.error("dm:join failed", err);
      socket.emit("dm:error", { code: "DM_JOIN_FAILED" });
    }
  });

  socket.on("dm:send", async ({ receiverId, message }) => {
    console.log("🔍 dm:send received:", {
      receiverId,
      message,
      userId: socket.data.userId,
    });
    try {
      const userId = socket.data.userId;
      if (!receiverId) {
        console.log("❌ dm:send: receiverId missing");
        return;
      }
      if (!message) {
        console.log("❌ dm:send: message missing");
        return;
      }

      const roomId = getRoomId(userId, receiverId);
      console.log("📍 roomId:", roomId);

      const conversation = await conversationModel.findOne({
        conversationKey: roomId,
      });

      if (!conversation) {
        console.log("❌ dm:send: conversation not found for roomId:", roomId);
        return;
      }

      console.log(
        "✅ Found conversation, participants:",
        conversation.participants,
      );
      if (!conversation.participants.some((id) => id.equals(userId))) {
        console.log("❌ dm:send: userId not in participants");
        return;
      }

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

      const conversation = await conversationModel.findOne({ conversationKey });
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
