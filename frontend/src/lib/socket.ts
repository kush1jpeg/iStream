// socket.ts
import { io, type Socket } from "socket.io-client";

const URL = "http://localhost:8888";
const namespaces = ["/sidebar", "/notify", "/live", "/dm", "/group", "/"];

let sockets: Record<string, any> = {};

export const connectAllSockets = () => {
  namespaces.forEach((ns) => {
    if (!sockets[ns]) {
      sockets[ns] = io(`${URL}${ns}`, {
        withCredentials: true,
        autoConnect: false,
      } as any);

      // Add connection event listeners for debugging
      sockets[ns].on("connect", () => {
        console.log(`✅ Connected to ${ns}:`, sockets[ns].id);
      });

      sockets[ns].on("disconnect", () => {
        console.log(`❌ Disconnected from ${ns}`);
      });

      sockets[ns].on("connect_error", (error: any) => {
        console.error(`❌ Connection error on ${ns}:`, error);
      });
    }
    if (!sockets[ns].connected) sockets[ns].connect();
  });
};

export const disconnectAllSockets = () => {
  Object.values(sockets).forEach((s) => s.disconnect());
  sockets = {};
};

export const getSocket = (ns: string): any | null => {
  return sockets[ns] ?? null; // never throw
};
