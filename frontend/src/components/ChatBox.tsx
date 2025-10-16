import { useState } from "react";
import { RetroContainer } from "./RetroContainer";
import { Send, Terminal } from "lucide-react";
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

  return (
    <RetroContainer variant="terminal" glow className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-primary">
        <Terminal className="w-5 h-5 text-primary flicker" />
        <h2 className="font-pixel text-sm uppercase">Live Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 scanlines">
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
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type message..."
          className="flex-1 bg-input border-2 border-primary px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-glow"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </RetroContainer>
  );
};
