import { Namespace, Socket } from "socket.io";

export function registerGroupChatHandler(io: Namespace, socket: Socket) {
  socket.on("group:join", async ({ conversationKey }) => {
    try {
      if (!conversationKey) {
        socket.emit("group:error", { code: "INVALID_PAYLOAD" });
        return;
      }
      const userId = socket.data.userId;

      const group = await conversationModel.findOne({ conversationKey });
      if (!group) {
        socket.emit("group:error", { code: "GROUP_NOT_FOUND" });
        return;
      }

      // Check if user is part of the group
      if (!group.participants.some((id) => id.equals(userId))) {
        socket.emit("group:error", { code: "NOT_A_MEMBER" });
        return;
      }

      socket.join(group.conversationKey);
    } catch (err) {
      console.error("dm:join failed", err);
      socket.emit("dm:error", { code: "DM_JOIN_FAILED" });
    }
  });

  socket.on("dm:send", async ({ conversationKey, message }) => {
    try {
      const userId = socket.data.userId;
      if (!conversationKey || !message) {
        socket.emit("group:error", { code: "INVALID_PAYLOAD" });
        return;
      }

      const conversation = await conversationModel.findOne({
        conversationKey,
      });
      if (!conversation) return;
      if (!conversation.participants.some((id) => id.equals(userId))) return;

      const msg = await msgModel.create({
        senderId: userId,
        conversationKey: conversationKey,
        message,
      });

      socket.to(conversationKey).emit("dm:message", {
        senderId: userId,
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
      if (!conversationKey) {
        socket.emit("group:error", { code: "INVALID_PAYLOAD" });
        return;
      }
      const userId = socket.data.userId;

      await msgModel.updateMany(
        { conversationKey, senderId: { $ne: userId } },
        { $addToSet: { readBy: userId } }, // push is also there but set adds unique
      );

      const conversation = await conversationModel.findById(conversationKey);
      if (!conversation) {
        socket.emit("group:error", { code: "Conversation NOT FOUND" });
        return;
      }
      if (!conversation.participants.some((id) => id.equals(userId))) {
        socket.emit("group:error", { code: "CANNOT PARTICIPATE" });
        return;
      }

      const otherParticipants = conversation.participants.filter(
        (id) => id.toString() !== userId,
      );
      if (!otherParticipants) {
        socket.emit("group:error", { code: "NO PARTICIPANTS FOUND" });
        return;
      }
      otherParticipants.forEach((participantId) => {
        socket.to(conversationKey).emit("message:read", {
          conversationKey,
          readerId: userId,
        });
      });
    } catch (err) {
      console.error("dm:read failed", err);
      socket.emit("dm:error", { code: "DM_READ_FAILED" });
    }
  });

  socket.on("dm:leave", ({ conversationKey }) => {
    if (!conversationKey) {
      socket.emit("group:error", { code: "INVALID_PAYLOAD" });
      return;
    }
    socket.leave(conversationKey);
  });
}
