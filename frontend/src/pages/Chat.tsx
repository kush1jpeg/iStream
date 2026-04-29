import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { Navigation } from "@/components/Navigation";
import { RetroContainer } from "@/components/RetroContainer";
import { Users, MessageCircle, Send, Loader, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN = localStorage.getItem("token") || "";

interface Conversation {
  _id: string;
  conversationKey: string;
  participants: { _id: string; username: string; avatar?: string }[];
  lastMessage?: { message: string; createdAt: string };
  isGroup: boolean;
  groupName?: string;
  unreadCount?: number;
}

interface Message {
  _id?: string;
  senderId: string;
  message: string;
  createdAt?: string;
  pending?: boolean;
}

const PAGE_SIZE = 30;

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function getOther(conv: Conversation, myId: string) {
  return conv.participants.find((p) => p._id !== myId);
}

function sameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatPage({ myId }: { myId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [socketReady, setSocketReady] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConv;

  // socket  
  useEffect(() => {
    const socket = io(`${API}/dm`, {
      auth: { token: TOKEN },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setSocketReady(true));
    socket.on("disconnect", () => setSocketReady(false));

    socket.on("dm:message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // mark unread if not in active conv
      setConversations((prev) =>
        prev.map((c) => {
          const other = getOther(c, myId);
          if (other?._id === msg.senderId && c._id !== activeConvRef.current?._id) {
            return { ...c, unreadCount: (c.unreadCount || 0) + 1 };
          }
          return c;
        })
      );
    });

    socket.on("message:read", ({ conversationKey }: { conversationKey: string; readerId: string }) => {
      setConversations((prev) =>
        prev.map((c) => (c.conversationKey === conversationKey ? { ...c, unreadCount: 0 } : c))
      );
    });

    return () => { socket.disconnect(); };
  }, [myId]);

  useEffect(() => {
    axios
      .get(`${API}/api/chat/`, { withCredentials: true })
      .then(({ data }) => setConversations(data.conversations || []))
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, []);

  // ── scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── open conversation ────────────────────────────────────────────────────────
  const openConversation = useCallback(
    async (conv: Conversation) => {
      if (activeConv?._id === conv._id) return;

      // leave old room
      if (activeConv) {
        const other = getOther(activeConv, myId);
        if (other) socketRef.current?.emit("dm:leave", { receiverId: other._id });
      }

      setActiveConv(conv);
      setMessages([]);
      setPage(1);
      setHasMore(false);
      setLoadingMsgs(true);

      // join new room
      const other = getOther(conv, myId);
      if (other) socketRef.current?.emit("dm:join", { receiverId: other._id });

      // mark read
      socketRef.current?.emit("dm:read", { conversationKey: conv.conversationKey });
      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      );

      try {
        const { data } = await axios.get(`${API}/api/chat/getConvo`, {
          params: { conversationKey: conv.conversationKey, page: 1, limit: PAGE_SIZE },
          withCredentials: true,
        });
        setMessages(data.messages || []);
        setHasMore((data.messages?.length || 0) === PAGE_SIZE);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMsgs(false);
      }
    },
    [activeConv, myId]
  );

  //fetch older messages  
  const fetchOlder = useCallback(async () => {
    if (!activeConv || !hasMore || loadingMsgs) return;
    const nextPage = page + 1;
    setLoadingMsgs(true);
    try {
      const { data } = await axios.get(`${API}/api/chat/getConvo`, {
        params: { conversationKey: activeConv.conversationKey, page: nextPage, limit: PAGE_SIZE },
        withCredentials: true,
      });
      setMessages((prev) => [...(data.messages || []), ...prev]);
      setPage(nextPage);
      setHasMore((data.messages?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [activeConv, hasMore, loadingMsgs, page]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (e.currentTarget.scrollTop < 60) fetchOlder();
    },
    [fetchOlder]
  );

  // send message  
  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeConv || !socketRef.current) return;
    const other = getOther(activeConv, myId);
    if (!other) return;

    const optimistic: Message = {
      senderId: myId,
      message: input.trim(),
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current.emit("dm:send", { receiverId: other._id, message: input.trim() });
    socketRef.current.once("dm:sent", () => {
      setMessages((prev) =>
        prev.map((m) => (m.pending && m.message === optimistic.message ? { ...m, pending: false } : m))
      );
    });
    setInput("");
    inputRef.current?.focus();
  }, [input, activeConv, myId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // groups / dm  
  const groups = conversations.filter((c) => c.isGroup);
  const dms = conversations.filter((c) => !c.isGroup);

  return (
    <div className="min-h-screen bg-background crt-container film-grain flex flex-col">
      <Navigation />
      <div className="flex flex-1 overflow-hidden container mx-auto px-4 py-4 gap-4">

        {/* ── LEFT PANEL ── */}
        <RetroContainer className="w-72 shrink-0 flex flex-col p-0 overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-primary flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-vhs-purple" />
            <span className="font-pixel text-xs uppercase text-primary tracking-wider">Messages</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-4 h-4 animate-spin text-vhs-purple" />
              </div>
            ) : (
              <>
                {/* Groups */}
                {groups.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className="h-px flex-1 bg-primary opacity-30" />
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3" /> groups
                      </span>
                      <div className="h-px flex-1 bg-primary opacity-30" />
                    </div>
                    {groups.map((conv) => (
                      <ConvItem
                        key={conv._id}
                        conv={conv}
                        myId={myId}
                        active={activeConv?._id === conv._id}
                        onClick={() => openConversation(conv)}
                      />
                    ))}
                  </div>
                )}

                {/* DMs */}
                <div>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <div className="h-px flex-1 bg-primary opacity-30" />
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> direct
                    </span>
                    <div className="h-px flex-1 bg-primary opacity-30" />
                  </div>
                  {dms.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground px-4 py-2 opacity-50">no conversations yet</p>
                  )}
                  {dms.map((conv) => (
                    <ConvItem
                      key={conv._id}
                      conv={conv}
                      myId={myId}
                      active={activeConv?._id === conv._id}
                      onClick={() => openConversation(conv)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Socket status */}
          <div className="px-4 py-2 border-t border-primary flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", socketReady ? "bg-terminal-green animate-pulse" : "bg-destructive")} />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              {socketReady ? "connected" : "disconnected"} | socket.io
            </span>
          </div>
        </RetroContainer>

        {/* ── RIGHT PANEL ── */}
        <RetroContainer className="flex-1 flex flex-col p-0 overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2 opacity-40">
                <MessageCircle className="w-8 h-8 text-vhs-purple mx-auto" />
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  select a conversation
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b-2 border-primary flex items-center gap-3">
                <div className="w-7 h-7 border border-vhs-purple flex items-center justify-center font-mono text-xs text-vhs-purple uppercase">
                  {activeConv.isGroup
                    ? (activeConv.groupName?.[0] || "G")
                    : (getOther(activeConv, myId)?.username?.[0] || "?")}
                </div>
                <span className="font-mono text-sm text-foreground">
                  @{activeConv.isGroup ? activeConv.groupName : getOther(activeConv, myId)?.username}
                </span>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                onScroll={handleScroll}
              >
                <div ref={messagesTopRef} />

                {loadingMsgs && page === 1 && (
                  <div className="flex justify-center py-4">
                    <Loader className="w-4 h-4 animate-spin text-vhs-purple" />
                  </div>
                )}

                {hasMore && !loadingMsgs && (
                  <button
                    onClick={fetchOlder}
                    className="w-full flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground hover:text-vhs-purple py-2 transition-colors"
                  >
                    <ChevronDown className="w-3 h-3 rotate-180" /> load older
                  </button>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.senderId === myId;
                  const showDate = i === 0 || !sameDay(messages[i - 1]?.createdAt, msg.createdAt);
                  return (
                    <div key={msg._id || i}>
                      {showDate && (
                        <div className="flex items-center gap-2 my-3">
                          <div className="h-px flex-1 bg-primary opacity-20" />
                          <span className="font-mono text-[10px] text-muted-foreground opacity-60">
                            — {formatDate(msg.createdAt)} —
                          </span>
                          <div className="h-px flex-1 bg-primary opacity-20" />
                        </div>
                      )}
                      <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[60%] space-y-1",
                          isMe ? "items-end" : "items-start",
                          "flex flex-col"
                        )}>
                          {!isMe && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border border-vhs-purple flex items-center justify-center font-mono text-[9px] text-vhs-purple uppercase">
                                {getOther(activeConv, myId)?.username?.[0] || "?"}
                              </div>
                              <span className="font-mono text-[10px] text-vhs-purple">
                                {getOther(activeConv, myId)?.username}
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground opacity-50">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "px-3 py-2 font-mono text-xs border",
                            isMe
                              ? "bg-vhs-purple/10 border-vhs-purple text-foreground"
                              : "bg-card border-primary text-foreground",
                            msg.pending && "opacity-50"
                          )}>
                            {msg.message}
                          </div>
                          {isMe && (
                            <span className="font-mono text-[9px] text-muted-foreground opacity-50">
                              {msg.pending ? "sending..." : formatTime(msg.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t-2 border-primary px-4 py-3 flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 bg-background border border-primary font-mono text-xs px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terminal-green resize-none"
                  style={{ minHeight: "36px", maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="border-2 border-vhs-purple text-vhs-purple p-2 hover:bg-vhs-purple hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 pb-2">
                <span className="font-mono text-[10px] text-muted-foreground opacity-40">
                  ENTER to send | SHIFT+ENTER for newline
                </span>
              </div>
            </>
          )}
        </RetroContainer>
      </div>
    </div>
  );
}

// ── ConvItem ──────────────────────────────────────────────────────────────────
function ConvItem({
  conv,
  myId,
  active,
  onClick,
}: {
  conv: Conversation;
  myId: string;
  active: boolean;
  onClick: () => void;
}) {
  const other = getOther(conv, myId);
  const name = conv.isGroup ? conv.groupName : other?.username;
  const preview = (conv.lastMessage as any)?.message || "No messages yet";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 text-left flex items-start gap-3 border-b border-primary/20 hover:bg-vhs-purple/10 transition-colors",
        active && "bg-vhs-purple/20 border-l-2 border-l-vhs-purple"
      )}
    >
      <div className={cn(
        "w-7 h-7 shrink-0 border flex items-center justify-center font-mono text-xs uppercase mt-0.5",
        active ? "border-vhs-purple text-vhs-purple" : "border-primary text-muted-foreground"
      )}>
        {name?.[0] || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "font-mono text-xs truncate",
            active ? "text-vhs-purple" : "text-foreground"
          )}>
            @{name}
          </span>
          {(conv.unreadCount ?? 0) > 0 && (
            <span className="shrink-0 bg-destructive text-background font-mono text-[10px] px-1.5 py-0.5 min-w-[18px] text-center">
              {conv.unreadCount}
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground truncate opacity-60 mt-0.5">
          {preview}
        </p>
      </div>
    </button>
  );
}

