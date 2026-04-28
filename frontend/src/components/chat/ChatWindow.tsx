import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, Smile } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { Conversation, Message } from "@/pages/Chat";
import Picker, { Theme } from "emoji-picker-react";

interface ChatWindowProps {
  conversation?: Conversation;
  messages: Message[];
  currentUserId: string;
}


export const ChatWindow = ({ conversation, messages, currentUserId }: ChatWindowProps) => {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emojiClick, setEmojiClick] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Would emit socket event here: dm:send or group:message

    console.log("Sending:", input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="h-full border-2 border-[#1ABC9C] bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center font-mono">
          <div className="text-[#1ABC9C] text-lg mb-2">NO SIGNAL</div>
          <div className="text-[#555] text-sm">Select a conversation to begin</div>
          <div className="text-[#1ABC9C]/30 text-xs mt-4 animate-pulse">
            ▓▓▓ AWAITING INPUT ▓▓▓
          </div>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = msg.timestamp.toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className="h-full border-2 border-[#1ABC9C] bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b-2 border-[#1ABC9C] bg-[#1ABC9C]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-pixel text-sm text-[#1ABC9C] uppercase">
            {conversation.type === "dm" ? `@${conversation.name}` : `#${conversation.name}`}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-1">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center gap-2 my-4 text-[10px] font-mono text-[#555]">
                <span className="flex-1 border-t border-dashed border-[#333]" />
                <span className="px-2">══ {date} ══</span>
                <span className="flex-1 border-t border-dashed border-[#333]" />
              </div>

              {/* Messages for this date */}
              {msgs.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  onEdit={() => setEditingId(msg.id)}
                  onDelete={() => console.log("Delete:", msg.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t-2 border-[#1ABC9C] bg-[#1ABC9C]/5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={cn(
                "w-full bg-[#0a0a0a] border-2 border-[#1ABC9C] px-3 py-2",
                "font-mono text-sm text-[#1ABC9C] placeholder:text-[#1ABC9C]/30",
                "focus:outline-none focus:shadow-[0_0_10px_rgba(26,188,156,0.3)]",
                "caret-[#1ABC9C]"
              )}
            />
          </div>

          {/* Emoji Button */}
          <div className="relative flex justify-end">
            <button
              onClick={() => setEmojiClick((prev) => !prev)}
              className="px-2 py-2 hover:translate-y-0.5 transition-all"
            >
              <Smile className="text-foreground" />
            </button>

            {emojiClick && (
              <div className="absolute bottom-full mb-2 right-0 z-50">
                <Picker theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "px-4 py-2 border-2 border-[#1ABC9C] bg-[#1ABC9C]/10",
              "text-[#1ABC9C] font-mono text-sm uppercase",
              "hover:bg-[#1ABC9C] hover:text-[#0a0a0a] transition-all",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "hover:shadow-[0_0_15px_rgba(26,188,156,0.5)]"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-[#555]">
          <span>ENTER to send</span>
          <span>|</span>
          <span>SHIFT+ENTER for newline</span>
        </div>
      </div>
    </div>
  );
};

