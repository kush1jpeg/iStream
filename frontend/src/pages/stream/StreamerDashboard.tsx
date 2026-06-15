import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket, connectAllSockets } from "@/lib/socket";
import { IPay, IStreamLog, IStreamRedisFrontend, LogLevel } from "@istream/shared";
import { useParams } from "react-router-dom";
import { api } from "@/App";
import { Radio } from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer"; // adjust path as needed
import { toast } from "react-toastify";
import { useSignalStrength } from "@/hooks/signalStrength";


interface IChatMessage {
  msg: string;
  userId: string;
  username: string;
  createdAt: Date;
}

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
  err: "[ERR]",
  info: "[INFO]",
};

const SC_TIERS: {
  min: number;
  border: string;
  bg: string;
  userColor: string;
  amtColor: string;
}[] = [
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
  const { streamId } = useParams();
  const [elapsed, setElapsed] = useState(0);
  const { latency, strength } = useSignalStrength();
  const bars = Math.round(strength / 10); // 0-10
  const [stats, setStats] = useState<IStreamRedisFrontend | null>({
    streamer: { username: "", avatar: "", frame: "", animation: "" },
    stream: { title: "", description: "", thumbnail: "", tags: [] },
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

  async function handleStreamEnd(streamId: string) {
    const data = await api.post(`/stream/${streamId}/end`);
    const outcome = data.data.success;
    if (outcome) toast.success(data.data.msg);
    getSocket("/")?.emit("stream:leave");
  }


  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get(`/stream/${streamId}`);
        setStats(data.stream);
      } catch (err) {
        console.error("Failed to fetch stream data:", err);
      }
    };
    init();
  }, [streamId]);

  const [logs, setLogs] = useState<IStreamLog[]>([]);
  const [chat, setChat] = useState<IChatMessage[]>([]);
  const [superchats, setSuperchats] = useState<IPay[]>([]);
  const [chatInput, setChatInput] = useState("");

  const chatBodyRef = useRef<HTMLDivElement>(null);

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

    streamSocket.emit("stream:join", { streamId });

    notifySocket?.on("stream:logs", (raw) => {
      console.log("recieved log in the frontend")
      const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
      setLogs((prev) =>
        [
          {
            userId: payload.userId,
            level: payload.level,
            msg: payload.msg,
            createdAt: new Date(payload.createdAt),
          },
          ...prev,
        ].slice(0, 200)
      );
    });

    streamSocket?.on("stream:chat", (data) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setChat((prev) =>
        [
          ...prev,
          {
            msg: parsed.msg,
            userId: parsed.userId,
            username: parsed.username,
            createdAt: new Date(parsed.createdAt),
          },
        ].slice(-300)
      );
    });

    streamSocket?.on("superchat", (data) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setSuperchats((prev: any) =>
        [
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
            expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
          },
          ...prev,
        ].slice(0, 100)
      );
    });

    return () => {
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
    liveSocket?.emit("stream:send", { streamId, text });
    setChatInput("");
  }, [chatInput]);

  const scTotal = superchats.reduce((a, s) => a + s.amount, 0);

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* ── TOP BAR ── */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <Radio className="w-6 h-6 text-primary" />
          <span style={S.liveBadge}>
            ●{" "}
            {
              { inactive: "WAITING FOR OBS-RTMP", pending: "WAITING FOR OBS-RTMP", live: "LIVE" }[
              stats?.status ?? "pending"
              ] ?? ""
            }
          </span>
        </div>

        <div style={S.statsRow}>
          {[
            { val: formatTime(elapsed), lbl: "SESSION" },
            { val: stats?.viewers?.toLocaleString() ?? "0", lbl: "VIEWERS" },
            { val: stats?.views ?? "0", lbl: "VIEWS" },
            { val: stats?.likes ?? "0", lbl: "LIKES" },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={S.stat}>
              <div style={S.statVal}>{val}</div>
              <div style={S.statLbl}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={S.controls}>
          <div className="flex items-center gap-6 font-mono text-[15px] text-gray-400 border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 rounded-md">

            {/* SIGNAL */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium ">SIGNAL</span>
              <span className={strength > 60 ? "text-green-500" : strength > 40 ? "text-yellow-500" : "text-red-500"}>
                {"▮".repeat(bars)} {strength ?? 0}%
              </span>
            </div>

            <div className="w-px h-4 bg-neutral-800" />

            {/* LATENCY */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600">LATENCY</span>
              <span className={latency < 100 ? "text-green-500" : latency < 250 ? "text-yellow-500" : "text-red-500"}>
                ~{latency ?? "..."}ms
              </span>
            </div>

            <div className="w-px h-4 bg-neutral-800" />

            {/* STATUS */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600">STATUS</span>
              <span
                className={
                  strength > 40
                    ? "text-green-500 tracking-wider"
                    : "text-red-500 tracking-wider animate-pulse"
                }
              >
                {strength > 40 ? "OPERATIONAL" : "DEGRADED"}
              </span>
            </div>

          </div>
          <CtrlBtn
            danger
            title="End stream"
            onClick={() => {
              if (window.confirm("End the stream?")) {
                handleStreamEnd(streamId);
              }
            }}
          >
            ⏹
          </CtrlBtn>
        </div>
      </div>

      <div style={S.body}>

        {/* LEFT: video (compact) + logs */}
        <div style={S.leftCol}>

          {/* ── Compact video player ── */}
          <div style={S.videoWrap}>
            <VideoPlayer streamUrl={stats?.HLS_PATH ?? ""} />
          </div>

          {/* stream title / tags */}
          <div style={S.titleBar}>
            <span style={{ fontSize: 11, color: "#c0c0d0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {stats?.stream.title || "—"}
            </span>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {stats?.stream.tags.map((t) => (
                <span key={t} style={S.tag}>{t}</span>
              ))}
            </div>
          </div>

          {/* logs — fills remaining left-col height */}
          <div style={S.logsSection}>
            <SectionHeader
              label="STREAM LOGS"
              right={<span style={{ color: "#444", fontSize: 10 }}>↓ TAIL</span>}
            />
            <div style={S.logsBody}>
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

        {/* MID: live chat — full height, no page scroll */}
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
            <button style={S.sendBtn} onClick={sendChat}>
              CHAT
            </button>
          </div>
        </div>

        {/* RIGHT: superchats — full height, no page scroll */}
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
            <span style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>
              SESSION TOTAL
            </span>
            <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: "bold" }}>
              ₹{scTotal.toLocaleString()}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}


function SectionHeader({
  label,
  right,
}: {
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={S.sectionHeader}>
      <span style={{ color: "#a78bfa" }}>{label}</span>
      {right}
    </div>
  );
}

function CtrlBtn({
  children,
  onClick,
  title,
  danger,
  active,
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
    <div
      style={{ ...S.scCard, borderLeftColor: t.border, background: t.bg }}
    >
      <div style={S.scHeader}>
        <span style={{ fontWeight: "bold", color: t.userColor, fontSize: 12 }}>
          {sc.username}
        </span>
        <span style={{ fontWeight: "bold", color: t.amtColor, fontSize: 13 }}>
          {sc.currency ?? "₹"}
          {sc.amount}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>
        {sc.message}
      </div>
      <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>
        {String(sc.createdAt)}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────


const S: Record<string, React.CSSProperties> = {
  /* The root sits to the RIGHT of the sidebar via marginLeft */
  root: {
    display: "flex",
    flexDirection: "column",
    height: "94vh",
    marginLeft: "5rem",
    background: "#0d0d12",
    color: "#e0e0e0",
    fontFamily: "'Courier New', monospace",
    boxSizing: "border-box",
    overflow: "hidden", // ← no outer scroll ever
  },

  /* ── Top bar ── */
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#13131a",
    borderBottom: "1px solid #2a2a3a",
    padding: "0 16px",
    height: 46,
    flexShrink: 0,
  },
  topLeft: { display: "flex", alignItems: "center", gap: 10 },
  liveBadge: {
    background: "#dc2626",
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: 3,
    letterSpacing: 1,
  },
  statsRow: { display: "flex", gap: 20, alignItems: "center" },
  stat: { textAlign: "center" },
  statVal: { fontSize: 13, fontWeight: "bold" },
  statLbl: { fontSize: 9, color: "#666", letterSpacing: 1 },
  controls: { display: "flex", alignItems: "center", gap: 8 },
  ctrlBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: "1px solid #2a2a3a",
    background: "#1a1a26",
    color: "#a0a0b0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontFamily: "inherit",
  },
  ctrlBtnDanger: { borderColor: "#dc2626", color: "#dc2626" },
  ctrlBtnActive: { background: "#dc2626", borderColor: "#dc2626", color: "#fff" },

  /* ── 3-col body ── fills remaining height entirely */
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 350px 350px",
    flex: 1,
    minHeight: 0, // critical — lets flex children shrink below content height
    maxHeight: "100vh",
    overflow: "hidden",
  },

  /* ── Left col ── */
  leftCol: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1e1e2e",
    overflow: "hidden",
    minHeight: 0,
  },

  /*
   * videoWrap: shrink-to-fit the player (aspect-video handled inside VideoPlayer).
   * We DO NOT give it flex:1 — the logs section will expand to fill the rest.
   */
  videoWrap: {
    flexShrink: 0,
    width: "100%",
  },

  titleBar: {
    padding: "6px 12px",
    background: "#13131a",
    borderTop: "1px solid #1e1e2e",
    borderBottom: "1px solid #1e1e2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    gap: 8,
  },
  tag: {
    fontSize: 9,
    padding: "2px 6px",
    borderRadius: 3,
    border: "1px solid #2a2a3a",
    color: "#888",
    background: "#1a1a26",
  },

  /* logs expand to fill whatever space remains in leftCol */
  logsSection: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  logsBody: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 14px",
    fontSize: 10,
    lineHeight: 1.7,
  },
  logLine: { display: "flex", gap: 8, marginBottom: 1 },
  logTime: { color: "#444", minWidth: 55 },
  logType: { minWidth: 60 },
  logMsg: { color: "#888" },

  sectionHeader: {
    padding: "7px 14px",
    background: "#13131a",
    borderBottom: "1px solid #1e1e2e",
    fontSize: 10,
    color: "#666",
    letterSpacing: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },

  /* ── Mid col: chat — full height, internal scroll only ── */
  midCol: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1e1e2e",
    overflow: "hidden",
    minHeight: 0,
  },
  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 12px",
    minHeight: 0,
  },
  chatInputRow: {
    padding: "10px 12px",
    borderTop: "1px solid #1e1e2e",
    flexShrink: 0,
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    background: "#1a1a26",
    border: "1px solid #2a2a3a",
    borderRadius: 4,
    color: "#e0e0e0",
    padding: "6px 10px",
    fontSize: 11,
    fontFamily: "inherit",
    outline: "none",
  },
  sendBtn: {
    background: "#7c3aed",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    fontSize: 11,
    padding: "6px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  /* ── Right col: superchats — full height, internal scroll only ── */
  rightCol: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  scBody: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 12px",
    minHeight: 0,
  },
  scCard: {
    borderRadius: 6,
    padding: "10px 12px",
    borderLeft: "3px solid transparent",
    marginBottom: 10,
  },
  scHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  scTotalBar: {
    padding: "8px 12px",
    borderTop: "1px solid #1e1e2e",
    background: "#13131a",
    flexShrink: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};
