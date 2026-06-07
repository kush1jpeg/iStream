import { useState, useEffect, useRef, useCallback } from "react";
import { RetroContainer } from "@/components/RetroContainer";
import { Users, MessageCircle, Send, Loader, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/App";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/components/zustand/zustand";
import { IUserFrontend } from "@istream/shared";

interface Conversation {
  _id: string;
  avatar?: string; conversationKey: string;
  participants: { _id: string; username: string; avatar?: string }[]; lastMessage?: { message: string; createdAt: string };
  isGroup: boolean;
  groupName?: string;
  unreadCount?: number;
}
type SuggestionUser = IUserFrontend & {
  status: "offline" | "streaming";
};

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
  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([])

  const socketRef = useRef<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConv;

  const dmSocket = getSocket("/dm");
  const groupSocket = getSocket("/group");
  const socketsReady = useAuthStore((s) => s.socketsReady);


  useEffect(() => {
    if (!dmSocket || !groupSocket || !socketsReady) return;


    const currentSocket =
      activeConv?.isGroup
        ? groupSocket
        : dmSocket;
    socketRef.current = currentSocket;
    console.log(currentSocket);
    currentSocket.off("connect");
    currentSocket.off("disconnect");
    currentSocket.off("dm:message");
    currentSocket.off("message:read");

    currentSocket.on("connect", () => {
      console.log("connected");
      setSocketReady(true)
    }
    );

    currentSocket.on("disconnect", () =>
      setSocketReady(false)
    );

    currentSocket.on(
      "dm:message",
      (msg: Message) => {
        setMessages((prev) => [...prev, msg]);

        setConversations((prev) =>
          prev.map((c) => {
            const other = getOther(c, myId);

            if (
              other?._id === msg.senderId &&
              c._id !== activeConvRef.current?._id
            ) {
              return {
                ...c,
                unreadCount:
                  (c.unreadCount || 0) + 1,
              };
            }

            return c;
          })
        );
      }
    );

    currentSocket.on(
      "message:read",
      ({ conversationKey }) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationKey === conversationKey
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      }
    );

    return () => {
      currentSocket.off("connect");
      currentSocket.off("disconnect");
      currentSocket.off("dm:message");
      currentSocket.off("message:read");
    };
  }, [myId, activeConv?.isGroup, dmSocket, groupSocket, socketsReady]);


  useEffect(() => {
    const fetch = async () => {
      const data = await api.get(`chat/convo/all`, { withCredentials: true })
        .then(({ data }) => setConversations(data.conversations || []))
        .catch(console.error)
        .finally(() => setLoadingConvs(false));
      console.log(data);
      console.log(conversations);

    }
    fetch();
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
      if (activeConv.isGroup) {
        socketRef.current?.emit(
          "group:leave",
          {
            conversationKey:
              activeConv.conversationKey
          }
        );
      } else {
        const other =
          getOther(activeConv, myId);

        if (other) {
          socketRef.current?.emit(
            "dm:leave",
            {
              receiverId: other._id
            }
          );
        }
      }

      setActiveConv(conv);
      setMessages([]);
      setPage(1);
      setHasMore(false);
      setLoadingMsgs(true);

      // join new room
      if (!conv.isGroup) {
        const other = getOther(conv, myId);
        console.log(other);
        socketRef.current?.emit("dm:join", { receiverId: other._id });
      } else socketRef.current?.emit("dm:join", { conversationKey: conv.conversationKey });


      // mark read
      socketRef.current?.emit("dm:read", { conversationKey: conv.conversationKey });
      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      );

      try {
        const { data } = await api.get(`/chat/get/convo`, {
          params: { conversationKey: conv.conversationKey, page: 1, limit: PAGE_SIZE },
          withCredentials: true,
        });
        console.log(data)
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
      const { data } = await api.get(`/chat/get/convo`, {
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
    console.log("sending msg");
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

    if (activeConv.isGroup) {
      socketRef.current.emit(
        "group:send",
        {
          conversationKey:
            activeConv.conversationKey,
          message: input.trim(),
        }
      );
    } else {
      const other =
        getOther(activeConv, myId);

      if (!other) return;

      socketRef.current.emit(
        "dm:send",
        {
          receiverId: other._id,
          message: input.trim(),
        }
      );
    }

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

  const createConvo = async (id: string) => {
    try {
      const { data } = await api.post(
        "/chat/create/convo",
        { receiverId: id },
        { withCredentials: true }
      );

      const convo = data.conversation;

      setConversations((prev) => {
        const exists = prev.some((c) => c._id === convo._id);
        if (exists) return prev;
        return [convo, ...prev];
      });

      setActiveConv(data.conversation);
      // join socket room - use dmSocket directly since it's available
      dmSocket?.emit("dm:join", {
        receiverId: id,
      });

      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (conversations.length === 0) {
        const data = await api.get("/chat/suggest")
        const live = data.data.data.live;
        const offline = data.data.data.offline;
        const merged = [
          ...live.map((u: IUserFrontend) => ({ ...u, status: "streaming" })),
          ...offline.map((u: IUserFrontend) => ({ ...u, status: "offline" })),
        ];

        setSuggestions(merged);
      }
    }
    fetchData()
  }, [conversations])

  return (
    <div className="h-[95vh] bg-background crt-container film-grain flex flex-col">
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
                        avatar={conv.avatar}
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
                    <div className="p-3 font-mono">
                      <p className="text-center text-[12px] text-purple-600 m-4 mb-10">_ no active conversations</p>

                      <p className="text-[13px] tracking-widest text-purple-500 mb-3 border-t-2">// start a conversation</p>
                      {suggestions.map((user) => (
                        <div key={user._id} className="flex items-center gap-3 px-3 py-2 border-l-2 border-purple-700 border-y border-y-purple-950 bg-purple-950/20 cursor-pointer mb-1.5 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-indigo-900 border border-purple-700 flex items-center justify-center text-[11px] text-purple-300 shrink-0">
                            <img src={user.avatar} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-purple-100 truncate">{user.username}</p>
                            <p className="text-[10px] text-purple-600">{user.status}</p>
                          </div>
                          <button
                            onClick={() => createConvo(user._id)}
                            className="text-[9px] uppercase tracking-widest text-purple-500 border border-purple-700 px-2 py-1  hover:text-white transition-colors"
                          >
                            msg
                          </button>
                        </div>
                      ))}
                    </div>
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
            <span className="font-mono text-[12px] text-muted-foreground uppercase">
              {socketReady ? "connected" : "select a chat to connect"} | socket.io
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
                    ? <img src={activeConv.avatar} alt="avatar" />
                    : <img src={getOther(activeConv, myId)?.avatar} alt="avatar" />}
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
                                {getOther(activeConv, myId)?.avatar || "?"}
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
  avatar,
  onClick,
}: {
  conv: Conversation;
  myId: string;
  active: boolean;
  avatar?: string;
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
        "w-9 h-9 shrink-0 border flex items-center justify-center font-mono text-xs uppercase mt-0.5",
        active ? "border-vhs-purple text-vhs-purple" : "border-primary text-muted-foreground"
      )}>
        <img src={avatar ? avatar : other.avatar} />
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

