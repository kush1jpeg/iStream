import { io } from "socket.io-client";

export const liveSocket = io("http://localhost:8888/live", {
  withCredentials: true,
});

export const Rootsocket = io("http://localhost:8888", {
  withCredentials: true,
});

export const dmSocket = io("http://localhost:8888/dm", {
  withCredentials: true,
});

export const notifySocket = io("http://localhost:8888/notify", {
  withCredentials: true,
});

export const groupSocket = io("http://localhost:8888/group", {
  withCredentials: true,
});

Rootsocket.on("connect_error", (err) => {
  console.log("SOCKET ERROR:");
  console.log(err.message);
  console.log(err);
});

notifySocket.on("connect_error", (err) => {
  console.log("SOCKET ERROR:");
  console.log(err.message);
  console.log(err);
});

groupSocket.on("connect_error", (err) => {
  console.log("SOCKET ERROR:");
  console.log(err.message);
  console.log(err);
});

dmSocket.on("connect_error", (err) => {
  console.log("SOCKET ERROR:");
  console.log(err.message);
  console.log(err);
});

liveSocket.on("connect_error", (err) => {
  console.log("SOCKET ERROR:");
  console.log(err.message);
  console.log(err);
});
