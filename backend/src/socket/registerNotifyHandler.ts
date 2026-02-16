import { Namespace, Socket } from "socket.io";

export function registerNotifyHandler(io: Namespace, socket: Socket) {
  socket.join(socket.data.userId);
}
