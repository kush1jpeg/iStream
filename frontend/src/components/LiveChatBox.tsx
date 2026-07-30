import { useEffect, useRef, useState } from "react";
import { RetroContainer } from "./RetroContainer";
import { Send, Smile, Terminal } from "lucide-react";
import Picker from "emoji-picker-react";
import { SuperChatSelector } from "./ui/superchat";
import { cn } from "@/lib/utils";
import { connectAllSockets, getSocket } from "@/lib/socket";
import { useAuthStore } from "./zustand/zustand";

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: Date;
}

interface StreamChatPayload {
  msg: string;
  userId: string;
  username: string;
  createdAt: string | number | Date;
}

export const ChatBox = ({ streamId }: { streamId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    connectAllSockets();
    const liveSocket = getSocket("/live");
    if (!liveSocket) return;

    const joinRoom = () => {
      if (!streamId) return;
      liveSocket.emit("stream:join", { streamId });
    };

    const receiveMessage = (payload: StreamChatPayload | string) => {
      let chat: StreamChatPayload;
      try {
        chat = typeof payload === "string" ? JSON.parse(payload) : payload;
      } catch {
        return;
      }
      if (!chat?.msg || !chat.userId || !chat.username) return;

      const createdAt = new Date(chat.createdAt);
      if (Number.isNaN(createdAt.getTime())) return;

      setMessages((previous) =>
        [
          ...previous,
          {
            id: `${chat.userId}-${createdAt.getTime()}-${previous.length}`,
            userId: chat.userId,
            username: chat.username,
            message: chat.msg,
            createdAt,
          },
        ].slice(-300)
      );
    };

    const handleConnectError = (error: any) => {
      console.error("Live socket connect error:", error);
    };

    if (liveSocket.connected) {
      joinRoom();
    }

    liveSocket.on("connect", joinRoom);
    liveSocket.on("connect_error", handleConnectError);
    liveSocket.on("stream:chat", receiveMessage);
    liveSocket.on("stream:chat:error", (errorMessage: string) => {
      console.error("Stream chat error:", errorMessage);
    });

    return () => {
      liveSocket.off("connect", joinRoom);
      liveSocket.off("connect_error", handleConnectError);
      liveSocket.off("stream:chat", receiveMessage);
      liveSocket.off("stream:chat:error");
      liveSocket.emit("stream:leave", { streamId });
    };
  }, [streamId]);

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleSend = () => {
    const message = input.trim();
    if (!message) return;

    const liveSocket = getSocket("/live");
    if (!liveSocket) {
      console.error("Live socket not connected");
      return;
    }

    liveSocket.emit("stream:send", { streamId, msg: message });
    setInput("");
  };

  // auto scroll
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <RetroContainer variant="terminal" glow className="h-[88vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-primary">
        <Terminal className="w-5 h-5 text-primary flicker" />
        <h2 className="font-pixel text-sm uppercase">Live Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 scanlines chat-scroll" ref={messagesContainerRef}>
        {messages.map((msg) => (
          <div key={msg.id} className="group animate-slide-in">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground">
                {msg.createdAt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
              <span className={cn(
                "text-sm font-mono",
                String(user?._id) === msg.userId ? "text-accent" : "text-primary"
              )}>
                {String(user?._id) === msg.userId ? "you" : msg.username}:
              </span>
            </div>
            <p className="text-sm pl-14 text-foreground">{msg.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative flex gap-2 w-full">
        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
              setShowEmoji(false);
            }
          }}
          placeholder="Type message..."
          className="flex-1 bg-input border-2 border-primary px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-glow"
        />

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmoji((prev) => !prev)}
          className="absolute right-0 mr-14 flex items-center justify-center px-2 py-2 bg-none hover:translate-y-0.5 transition-all"
        >
          <Smile className="w-5 h-5 text-foreground" />
        </button>

        {/* Send Button */}
        <button
          onClick={() => { handleSend(); setShowEmoji(false); }}
          className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Send className="w-4 h-4" />
        </button>

        {/* Emoji Picker */}
        {showEmoji && (
          <div className="absolute  bottom-8 right-0 mb-5">
            <Picker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      <SuperChatSelector
        onSelect={(option) => console.log("User selected:", option)}
      />

    </RetroContainer>

  );
};
