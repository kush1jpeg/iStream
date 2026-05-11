import { io } from "socket.io-client";

export const socket = io("http://localhost:8888", {
  withCredentials: true,
  transports: ["websocket"],
});
