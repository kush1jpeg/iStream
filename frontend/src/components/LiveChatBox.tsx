import { useEffect, useRef, useState } from "react";
import { RetroContainer } from "./RetroContainer";
import { Send, Smile, Terminal } from "lucide-react";
import Picker from "emoji-picker-react";
import { SuperChatSelector } from "./ui/superchat";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", username: "retro_user", message: "This stream is amazing!", timestamp: "12:34" },
    { id: "2", username: "pixel_fan", message: "Love the analog vibes", timestamp: "12:35" },
    { id: "3", username: "vhs_collector", message: "Reminds me of old broadcasts", timestamp: "12:36" },
  ]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      username: "you",
      message: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    setMessages([...messages, newMessage]);
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
              <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
              <span className={cn(
                "text-sm font-mono",
                msg.username === "you" ? "text-accent" : "text-primary"
              )}>
                {msg.username}:
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
