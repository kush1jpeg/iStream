import { useEffect } from "react";
import { Radio, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { connectAllSockets, getSocket } from "@/lib/socket";
import {
  type StreamSessionStatus,
  useAuthStore,
  useStreamSessionStore,
} from "./zustand/zustand";

type SessionStatusPayload = {
  status: StreamSessionStatus;
  streamId: string | null;
};

export default function PersistentStreamBadge() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { status, streamId, setStreamSession } = useStreamSessionStore();

  useEffect(() => {
    if (!user) {
      setStreamSession("idle", null);
      return;
    }

    connectAllSockets();
    const socket = getSocket("/notify");
    if (!socket) return;

    const checkActiveSession = () => socket.emit("check:active-session");
    const handleSessionStatus = (payload: SessionStatusPayload) => {
      if (
        !payload ||
        !["idle", "pending", "live"].includes(payload.status)
      ) {
        return;
      }

      setStreamSession(payload.status, payload.streamId ?? null);
    };

    // Stream lifecycle logs mean the Redis status may have changed. Ask the
    // backend for the canonical session instead of deriving state from a log.
    const handleStreamLog = () => checkActiveSession();

    socket.on("connect", checkActiveSession);
    socket.on("session:status", handleSessionStatus);
    socket.on("stream:logs", handleStreamLog);

    if (socket.connected) checkActiveSession();

    return () => {
      socket.off("connect", checkActiveSession);
      socket.off("session:status", handleSessionStatus);
      socket.off("stream:logs", handleStreamLog);
    };
  }, [user, setStreamSession]);

  if (status === "idle" || !streamId) return null;

  const isLive = status === "live";

  return (
    <button
      type="button"
      onClick={() => navigate(`/stream/${streamId}/dashboard`)}
      className={`fixed right-4 top-4 z-[100] flex items-center gap-2 border-2 px-3 py-2 font-pixel text-[9px] uppercase tracking-wider shadow-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${isLive
        ? "border-red-500 bg-red-950/95 text-red-100 shadow-red-500/30 focus:ring-red-500"
        : "border-amber-400 bg-amber-950/95 text-amber-100 shadow-amber-400/20 focus:ring-amber-400"
        }`}
      aria-label={`${isLive ? "You're live" : "Waiting for OBS"}. Open stream dashboard`}
    >
      {isLive ? (
        <Radio className="h-3.5 w-3.5 animate-pulse text-red-400" />
      ) : (
        <Video className="h-3.5 w-3.5 text-amber-300" />
      )}
      <span>{isLive ? "You're live" : "Waiting for OBS"}</span>
    </button>
  );
}
