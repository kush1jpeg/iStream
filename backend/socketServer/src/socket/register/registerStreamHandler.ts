import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";

export function registerStreamHandler(io: Server, socket: Socket) {
  socket.on("stream:join", async ({ streamId }) => {
    // do a streamId check based on redis hash
    if (!(await redis.exists(`stream:${streamId}`))) {
      return socket.emit("error", "Stream does not exist");
    }
    socket.join(streamId);

    let viewers = await redis.hincrby(`stream:${streamId}`, "viewers", 1); // for tracking active viewers
    let views = await redis.hincrby(`stream:${streamId}`, "views", 1); // for the total views
    viewers = Math.max(0, viewers);
    io.to(streamId).emit("stream:viewers", Number(viewers));
    io.to(streamId).emit("stream:views", Number(views));
  });

  socket.on("stream:leave", async ({ streamId }) => {
    socket.leave(streamId);

    const viewers = await redis.hincrby(`stream:${streamId}`, "viewers", -1);

    io.to(streamId).emit("stream:viewers", Number(viewers));
  });
}
