import { Namespace, Socket } from "socket.io";
import { conversationModel } from "../models/conversation";
import { msgModel } from "../models/msgPvt";
import { conversationCache } from "../handler";

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
      if (!conversationCache.has(roomId)) {
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
        conversationCache.set(roomId, new Set([userId, receiverId]));
      }
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
      const participants = conversationCache.get(roomId);
      if (!participants) {
        // refetch the db
      }

      const msg = await msgModel.create({
        senderId: userId,
        conversationKey: roomId,
        message,
      }); // grpc call

      socket.to(roomId).emit("dm:message", {
        senderId: userId,
        receiverId,
        message,
      });

      socket.emit("dm:sent", { ok: true });

      conversation.lastMessage = msg.id; // grpc call again or redis streams
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
      ); //grpc call

      let participants = conversationCache.get(conversationKey);
      if (!participants) {
        // refetch the db
        return;
      }

      const otherParticipants = [...participants].filter((id) => id !== userId);
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
