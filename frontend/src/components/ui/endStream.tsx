import { api } from "@/App";
import { getSocket } from "@/lib/socket";
import { useState } from "react";
import { toast } from "react-toastify";

type EndStreamProps = {
  streamId?: string;
  onClose: () => void;
  onEnded?: () => void;
};

export function EndStream({ streamId, onClose, onEnded }: EndStreamProps) {
  const [ending, setEnding] = useState(false);

  async function handleStreamEnd() {
    if (!streamId || ending) return;

    setEnding(true);
    try {
      const { data } = await api.post(`/stream/${streamId}/end`);
      if (!data.success) {
        toast.error(data.message || "Failed to end stream");
        return;
      }

      getSocket("/")?.emit("stream:leave", { streamId });
      getSocket("/live")?.emit("stream:leave", { streamId });
      toast.success(data.message || "Stream ended");
      onEnded?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to end stream");
    } finally {
      setEnding(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999,
    }}>
      <div style={{
        background: "#0d0d1a",
        border: "1px solid #3a1a1a",
        borderRadius: 8,
        padding: 24,
        width: 280,
        fontFamily: "'Courier New', monospace",
        position: "relative",
      }}>
        <div style={{ height: 2, background: "#dc2626", borderRadius: "8px 8px 0 0", position: "absolute", top: 0, left: 0, right: 0 }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#dc2626", textTransform: "uppercase", marginBottom: 12 }}>// warning</div>
        <div style={{ fontSize: 13, color: "#e0e0e0", marginBottom: 6 }}>terminate stream?</div>
        <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 20, lineHeight: 1.5 }}>
          this action is irreversible.<br />viewers will be disconnected.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={ending}
            style={{
              flex: 1, height: 32, borderRadius: 6,
              border: "1px solid #2a2a3a", background: "#1a1a26",
              color: "#6a6a8a", cursor: ending ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace",
              fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
              opacity: ending ? 0.5 : 1,
            }}
          >
            abort
          </button>
          <button
            onClick={handleStreamEnd}
            disabled={ending || !streamId}
            style={{
              flex: 1, height: 32, borderRadius: 6,
              border: "1px solid #dc2626", background: ending ? "#dc2626" : "transparent",
              color: ending ? "#0d0d1a" : "#dc2626", cursor: ending || !streamId ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace",
              fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
              opacity: !streamId ? 0.5 : 1,
            }}
          >
            {ending ? "ending..." : "confirm kill"}
          </button>
        </div>
      </div>
    </div>
  );
}
