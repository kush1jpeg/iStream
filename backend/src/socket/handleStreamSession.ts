import { Socket } from "socket.io";
import { redis } from "../config/redis";

export const handleStreamSessionCheck = async (socket: Socket) => {
    try {
        const userId = socket.data.userId;

        if (!userId) {
            return;
        }

        const streamId = await redis.get(`live:user:${userId}`);
        if (!streamId) {
            return socket.emit("session:status", {
                status: "idle",
                streamId: null,
            });
        }

        const status = await redis.hget(`stream:${streamId}`, "status");
        const normalizedStatus =
            status === "live"
                ? "live"
                : status === "pending" || status === "inactive"
                    ? "pending"
                    : "idle";

        socket.emit("session:status", {
            status: normalizedStatus,
            streamId,
        });

    } catch (error) {
        console.error("Failed to check stream session:", error);

        socket.emit("session:status", {
            status: "idle",
            streamId: null,
            error: "SESSION_CHECK_FAILED",
        });
    }
};