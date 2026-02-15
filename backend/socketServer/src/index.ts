import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { socketHandler } from "./socket/handler";

const SOCKET_PORT = process.env.SOCKET_PORT || 3001;

async function main() {
  const httpServer = http.createServer();
  const io = new Server(httpServer, { cors: { origin: "*" } });

  const pubClient = new Redis({ host: "redis", port: 6379 });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  socketHandler(io);

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`Socket service running on :${SOCKET_PORT}`);
  });

  process.on("SIGTERM", async () => {
    httpServer.close(() => console.log("HTTP server closed"));

    setTimeout(() => {
      console.log("Force closing sockets...");
      io.close();
    }, 5000); // 5s grace period

    await pubClient.quit();
    await subClient.quit();
    console.log("Exiting");
    process.exit(0);
  });
}

main();
