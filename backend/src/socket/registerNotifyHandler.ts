import { Namespace, Socket } from "socket.io";
import { redisSub } from "../config/redis";

export function registerNotifyHandler(io: Namespace, socket: Socket) {
  socket.join(socket.data.userId);
}

export function redisSubNotifyListener(io: Namespace) {
  /* 

  * pub/sub has a subscription overhead; as ill be maintaining for 10k users 10k active redis pub/sub -> a better solution
   is using a queue like kafka or using redis streams so the notification can be rolled back incase the socket disconnects and reconnects,
   or if socket server is down; will improve afterwards.

  * using the pattern subscribe to get the userId asap without even parsing the msg in the global channel; would reduce the overhead
    of parsing, the caveat for a global channel is that Every notification read by socket server even if user offline

   * */
  redisSub.psubscribe("notifications:*", "stream:log:*");
  redisSub.on("pmessage", (pattern: string, channel: string, msg: string) => {
    if (!msg) {
      console.warn("Empty notifications");
      return;
    }
    const notifuserId = channel.split(":")[1];
    const streamUserId = channel.split(":")[2];
    if (pattern === "notifications:*") {
      console.log("got a notifcation - ", msg);
      io.to(notifuserId).emit("notifications", msg);
    } else if (pattern === "stream:log:*") {
      io.to(streamUserId).emit("stream:logs", msg);
    }
  });
}
