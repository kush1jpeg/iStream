import { Server, Socket } from "socket.io";

export function registerPvtChatHandler(io: Server, socket: Socket) {
  socket.on("dm:join", async ({ receiverId }) => {
    const senderId = socket.data.userId;
    if (receiverId == senderId) return;

    if (!receiverId) return;
    const roomId =
      senderId < receiverId
        ? `dm:${senderId}:${receiverId}`
        : `dm:${receiverId}:${senderId}`;
    socket.join(roomId);
  });

  socket.on("dm:send", ({ otherUserId, message }) => {
    const userId = socket.data.userId;
    if (!otherUserId || !message) return;

    const roomId =
      userId < otherUserId
        ? `dm:${userId}:${otherUserId}`
        : `dm:${otherUserId}:${userId}`;

    io.to(roomId).emit("dm:message", {
      senderId: userId,
      receiverId: otherUserId,
      message,
      timestamp: Date.now(),
    });
  });

  socket.on("dm:leave", ({ receiverId }) => {
    if (!receiverId) return;
    const userId = socket.data.userId;

    const roomId =
      userId < receiverId
        ? `dm:${userId}:${receiverId}`
        : `dm:${receiverId}:${userId}`;

    socket.leave(roomId);
  });
}
