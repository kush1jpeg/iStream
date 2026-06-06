import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket, connectAllSockets } from "@/lib/socket";
import { IPay, IStreamLog, IStreamRedis, LogLevel } from "@/types/types";
import { useParams } from "react-router-dom";
import { api } from "@/App";
import { Radio } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────


interface IChatMessage {
  msg: string,
  userId: string,
  username: string,
  createdAt: Date,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const LOG_COLORS: Record<LogLevel, string> = {
  err: "#ef4444",
  info: "#60a5fa",
};
const LOG_LABELS: Record<LogLevel, string> = {
  err: "[ERR]", info: "[INFO]",
};

const SC_TIERS: { min: number; border: string; bg: string; userColor: string; amtColor: string }[] = [
  { min: 500, border: "#f59e0b", bg: "#1a1500", userColor: "#fbbf24", amtColor: "#f59e0b" },
  { min: 200, border: "#a78bfa", bg: "#150a2e", userColor: "#c4b5fd", amtColor: "#a78bfa" },
  { min: 100, border: "#60a5fa", bg: "#0a1628", userColor: "#93c5fd", amtColor: "#60a5fa" },
  { min: 0, border: "#22c55e", bg: "#0a1a10", userColor: "#86efac", amtColor: "#22c55e" },
];
function scTier(amount: number) {
  return SC_TIERS.find((t) => amount >= t.min) ?? SC_TIERS[SC_TIERS.length - 1];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StreamerDashboard() {
  // ── state ──
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const { streamId } = useParams();
  const [elapsed, setElapsed] = useState(0);

  const [stats, setStats] = useState<IStreamRedis>({
    streamer: {
      username: "",
      avatar: "",
      frame: "",
      animation: "",
    },
    stream: {
      title: "",
      description: "",
      thumbnail: "",
      tags: [],
    },
    streamerId: "",
    streamId: "",
    HLS_PATH: "",
    inactiveSince: null,
    status: "pending",
    viewers: "0",
    likes: "0",
    views: "0",
    createdAt: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get(`/stream/${streamId}`);
        console.log(data.stream)
        setStats(data.stream);
      } catch (err) {
        console.error("Failed to fetch stream data:", err);
      }
    };
    init();
  }, [streamId]);
  const [logs, setLogs] = useState<(IStreamLog)[]>([]);
  const [chat, setChat] = useState<(IChatMessage)[]>([]);
  const [superchats, setSuperchats] = useState<(IPay)[]>([]);
  const [chatInput, setChatInput] = useState("");

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const logsBodyRef = useRef<HTMLDivElement>(null);

  // ── timer ──
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // auto-scroll chat
  useEffect(() => {
    if (chatBodyRef.current)
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chat]);

  // ── sockets ──
  useEffect(() => {
    connectAllSockets();

    const notifySocket = getSocket("/notify");
    const streamSocket = getSocket("/");

    // join stream room to receive chat + superchats
    streamSocket.emit("stream:join", { streamId }); // or however you join rooms

    // stream logs
    notifySocket?.on("stream:logs", (raw) => {
      const payload = typeof raw === "string"
        ? JSON.parse(raw)
        : raw;

      setLogs((prev) => [
        {
          userId: payload.userId,
          level: payload.level,
          msg: payload.msg,
          createdAt: new Date(payload.createdAt),
        },
        ...prev,
      ].slice(0, 200));
    });

    // live chat
    streamSocket?.on("stream:chat", (data) => {
      const parsed =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      setChat((prev) => [
        ...prev,
        {
          msg: parsed.msg,
          userId: parsed.userId,
          username: parsed.username,
          createdAt: new Date(parsed.createdAt),
        },
      ].slice(-300));
    });

    // superchats
    streamSocket?.on("superchat", (data) => {
      const parsed =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      setSuperchats((prev) => [
        {
          _id: parsed._id,
          userId: parsed.userId,
          username: parsed.username,
          email: parsed.email,
          message: parsed.message,
          amount: parsed.amount,
          streamId: parsed.streamId,
          userPfp: parsed.userPfp,
          itemId: parsed.itemId,
          currency: parsed.currency,
          status: parsed.status,
          provider: parsed.provider,
          orderId: parsed.orderId,
          providerPaymentId: parsed.providerPaymentId,
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
          expiresAt: parsed.expiresAt
            ? new Date(parsed.expiresAt)
            : null,
        },
        ...prev,
      ].slice(0, 100));
    }); return () => {
      notifySocket?.off("stream:logs");
      streamSocket?.off("stream:chat");
      streamSocket?.off("superchat");
    };
  }, []);
  // ── send chat ──
  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    const liveSocket = getSocket("/live");
    liveSocket?.emit("stream:send", { streamId, text }); // server echoes back
    setChatInput("");
  }, [chatInput]);

  // ── total superchats ──
  const scTotal = superchats.reduce((a, s) => a + s.amount, 0);

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* ── TOP BAR ── */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <Radio className="w-8 h-8 text-primary" />
          <span style={S.logo}> iSTREAM</span>
          <span style={S.liveBadge}>● LIVE{stats.status === "pending" && "WAITING FOR OBS-RTMP"}</span>
        </div>

        <div style={S.statsRow}>
          {[
            { val: formatTime(elapsed), lbl: "SESSION" },
            { val: stats.viewers.toLocaleString(), lbl: "VIEWERS" },
            { val: stats.views, lbl: "VIEWS" },
            { val: stats.likes, lbl: "LIKES" },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={S.stat}>
              <div style={{ ...S.statVal }}>{val}</div>
              <div style={S.statLbl}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={S.controls}>
          <CtrlBtn
            active={!micOn}
            danger={!micOn}
            onClick={() => setMicOn((v) => !v)}
            title={micOn ? "Mute mic" : "Unmute mic"}
          >
            {micOn ? "🎙" : "🔇"}
          </CtrlBtn>
          <CtrlBtn
            active={!camOn}
            danger={!camOn}
            onClick={() => setCamOn((v) => !v)}
            title={camOn ? "Disable camera" : "Enable camera"}
          >
            {camOn ? "📷" : "🚫"}
          </CtrlBtn>
          <CtrlBtn
            danger
            title="End stream"
            onClick={() => {
              if (window.confirm("End the stream?")) {
                getSocket("/live")?.emit("stream:end");
              }
            }}
          >
            ⏹
          </CtrlBtn>
        </div>
      </div>

      {/* ── 3-COL BODY ── */}
      <div style={S.body}>

        {/* LEFT: preview + logs */}
        <div style={S.leftCol}>
          {/* video preview */}
          <div style={S.videoWrap}>
            <div style={S.videoPlaceholder}>
              <div style={S.videoPill}>
                <span style={{ color: "#a78bfa" }}>((·))</span>&nbsp;STREAM PREVIEW
              </div>
              <div style={S.videoCenter}>
                <span style={{ fontSize: 42, color: "#2a2a4a" }}>▶</span>
                <span style={{ fontSize: 11, color: "#2a2a4a", letterSpacing: 2 }}>
                  {micOn ? "" : "🔇 MIC OFF"}&nbsp;{camOn ? "" : "📷 CAM OFF"}
                </span>
              </div>
              <div style={S.videoControls}>
                {["🔇", "⛶", "📸"].map((ic, i) => (
                  <div key={i} style={S.vidCtrl}>{ic}</div>
                ))}
              </div>
            </div>
          </div>

          {/* stream title bar */}
          <div style={S.titleBar}>
            <span style={{ fontSize: 12, color: "#c0c0d0" }}>
              Late night coding — building iStream from scratch
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {["coding", "indie-dev", "nodejs"].map((t) => (
                <span key={t} style={S.tag}>{t}</span>
              ))}
            </div>
          </div>

          {/* logs */}
          <div style={S.logsSection}>
            <SectionHeader label="STREAM LOGS" right={<span style={{ color: "#444", fontSize: 10 }}>↓ TAIL</span>} />
            <div ref={logsBodyRef} style={S.logsBody}>
              {logs.length === 0 && (
                <div style={{ color: "#444", fontSize: 11 }}>Waiting for log events…</div>
              )}
              {logs.map((l, i) => (
                <div key={i} style={S.logLine}>
                  <span style={S.logTime}>{String(l.createdAt)}</span>
                  <span style={{ ...S.logType, color: LOG_COLORS[l.level] }}>
                    {LOG_LABELS[l.level]}
                  </span>
                  <span style={S.logMsg}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MID: chat */}
        <div style={S.midCol}>
          <SectionHeader
            label="LIVE CHAT"
            right={<span style={{ color: "#22c55e", fontSize: 10 }}>● LIVE</span>}
          />
          <div ref={chatBodyRef} style={S.chatBody}>
            {chat.length === 0 && (
              <div style={{ color: "#444", fontSize: 11 }}>No messages yet…</div>
            )}
            {chat.map((m, i) => (
              <ChatMsg key={i} msg={m} />
            ))}
          </div>
          <div style={S.chatInputRow}>
            <input
              style={S.chatInput}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Send a message…"
            />
            <button style={S.sendBtn} onClick={sendChat}>CHAT</button>
          </div>
        </div>

        {/* RIGHT: superchats */}
        <div style={S.rightCol}>
          <SectionHeader
            label="SUPERCHATS"
            right={
              <span style={{ color: "#f59e0b", fontSize: 10 }}>
                ▲ {superchats.length} TODAY
              </span>
            }
          />
          <div style={S.scBody}>
            {superchats.length === 0 && (
              <div style={{ color: "#444", fontSize: 11 }}>No superchats yet…</div>
            )}
            {superchats.map((sc, i) => (
              <ScCard key={i} sc={sc} />
            ))}
          </div>
          <div style={S.scTotalBar}>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>SESSION TOTAL</span>
            <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: "bold" }}>
              ₹{scTotal.toLocaleString()}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div style={S.sectionHeader}>
      <span style={{ color: "#a78bfa" }}>{label}</span>
      {right}
    </div>
  );
}

function CtrlBtn({
  children, onClick, title, danger, active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...S.ctrlBtn,
        ...(danger ? S.ctrlBtnDanger : {}),
        ...(active ? S.ctrlBtnActive : {}),
      }}
    >
      {children}
    </button>
  );
}


function ChatMsg({ msg }: { msg: IChatMessage }) {
  return (
    <div style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
      <span style={{ fontWeight: "bold", color: "#60a5fa", marginRight: 4 }}>
        {msg.username ?? msg.userId}
      </span>
      <span style={{ color: "#c0c0d0" }}>{msg.msg}</span>
    </div>
  );
}

function ScCard({ sc }: { sc: IPay }) {
  const t = scTier(sc.amount);
  return (
    <div style={{ ...S.scCard, borderLeftColor: t.border, background: t.bg }}>
      <div style={S.scHeader}>
        <span style={{ fontWeight: "bold", color: t.userColor, fontSize: 12 }}>{sc.username}</span>
        <span style={{ fontWeight: "bold", color: t.amtColor, fontSize: 13 }}>
          {sc.currency ?? "₹"}{sc.amount}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>{sc.message}</div>
      <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>{String(sc.createdAt)}</div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root: {
    display: "flex", flexDirection: "column", height: "100vh",
    background: "#0d0d12", color: "#e0e0e0", fontFamily: "'Courier New', monospace",
    boxSizing: "border-box",
  },
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#13131a", borderBottom: "1px solid #2a2a3a",
    padding: "0 16px", height: 48, flexShrink: 0,
  },
  topLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { color: "#a78bfa", fontSize: 15, fontWeight: "bold", letterSpacing: 2 },
  liveBadge: {
    background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: "bold",
    padding: "2px 8px", borderRadius: 3, letterSpacing: 1,
  },
  statsRow: { display: "flex", gap: 20, alignItems: "center" },
  stat: { textAlign: "center" },
  statVal: { fontSize: 14, fontWeight: "bold" },
  statLbl: { fontSize: 10, color: "#666", letterSpacing: 1 },
  controls: { display: "flex", alignItems: "center", gap: 8 },
  ctrlBtn: {
    width: 34, height: 34, borderRadius: 6, border: "1px solid #2a2a3a",
    background: "#1a1a26", color: "#a0a0b0", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, fontFamily: "inherit",
  },
  ctrlBtnDanger: { borderColor: "#dc2626", color: "#dc2626" },
  ctrlBtnActive: { background: "#dc2626", borderColor: "#dc2626", color: "#fff" },

  body: {
    display: "grid", gridTemplateColumns: "1fr 280px 280px",
    flex: 1, overflow: "hidden",
  },

  leftCol: {
    display: "flex", flexDirection: "column",
    borderRight: "1px solid #1e1e2e", overflow: "hidden",
  },
  videoWrap: { flex: 1, background: "#000", position: "relative", minHeight: 0 },
  videoPlaceholder: {
    width: "100%", height: "100%", background: "#0a0a10",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  videoPill: {
    position: "absolute", top: 10, left: 10,
    background: "rgba(0,0,0,0.7)", border: "1px solid #2a2a3a",
    borderRadius: 4, padding: "3px 10px", fontSize: 10, color: "#aaa", letterSpacing: 1,
  },
  videoCenter: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  },
  videoControls: {
    position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6,
  },
  vidCtrl: {
    background: "rgba(0,0,0,0.75)", border: "1px solid #333",
    borderRadius: 4, color: "#aaa", fontSize: 13,
    width: 28, height: 28, display: "flex",
    alignItems: "center", justifyContent: "center", cursor: "pointer",
  },
  titleBar: {
    padding: "8px 14px", background: "#13131a",
    borderTop: "1px solid #1e1e2e",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", flexShrink: 0,
  },
  tag: {
    fontSize: 10, padding: "2px 7px", borderRadius: 3,
    border: "1px solid #2a2a3a", color: "#888", background: "#1a1a26",
  },

  logsSection: {
    height: 160, flexShrink: 0,
    borderTop: "1px solid #1e1e2e",
    display: "flex", flexDirection: "column",
  },
  logsBody: {
    flex: 1, overflowY: "auto", padding: "8px 14px",
    fontSize: 10, lineHeight: 1.7,
  },
  logLine: { display: "flex", gap: 8, marginBottom: 1 },
  logTime: { color: "#444", minWidth: 55 },
  logType: { minWidth: 60 },
  logMsg: { color: "#888" },

  sectionHeader: {
    padding: "7px 14px", background: "#13131a",
    borderBottom: "1px solid #1e1e2e", fontSize: 10,
    color: "#666", letterSpacing: 2,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0,
  },

  midCol: {
    display: "flex", flexDirection: "column",
    borderRight: "1px solid #1e1e2e", overflow: "hidden",
  },
  chatBody: {
    flex: 1, overflowY: "auto",
    padding: "10px 12px", minHeight: 0,
  },
  chatInputRow: {
    padding: "10px 12px",
    borderTop: "1px solid #1e1e2e",
    flexShrink: 0, display: "flex", gap: 6, alignItems: "center",
  },
  chatInput: {
    flex: 1, background: "#1a1a26", border: "1px solid #2a2a3a",
    borderRadius: 4, color: "#e0e0e0", padding: "6px 10px",
    fontSize: 11, fontFamily: "inherit", outline: "none",
  },
  sendBtn: {
    background: "#7c3aed", border: "none", borderRadius: 4,
    color: "#fff", fontSize: 11, padding: "6px 12px",
    cursor: "pointer", fontFamily: "inherit",
  },
  badge: {
    display: "inline-block", fontSize: 9, padding: "1px 5px",
    borderRadius: 2, marginRight: 4, verticalAlign: "middle",
  },

  rightCol: { display: "flex", flexDirection: "column", overflow: "hidden" },
  scBody: { flex: 1, overflowY: "auto", padding: "10px 12px", minHeight: 0 },
  scCard: {
    borderRadius: 6, padding: "10px 12px",
    borderLeft: "3px solid transparent", marginBottom: 10,
  },
  scHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 5,
  },
  scTotalBar: {
    padding: "8px 12px", borderTop: "1px solid #1e1e2e",
    background: "#13131a", flexShrink: 0,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
};
