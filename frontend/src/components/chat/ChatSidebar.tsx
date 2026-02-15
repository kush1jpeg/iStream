import { cn } from "@/lib/utils";
import { MessageSquare, Users, Radio, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/pages/Chat";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export const ChatSidebar = ({ conversations, activeId, onSelect }: ChatSidebarProps) => {
  const dms = conversations.filter(c => c.type === "dm");
  const groups = conversations.filter(c => c.type === "group");

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="h-full border-2 border-[#9B59B6] bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b-2 border-[#9B59B6] bg-[#9B59B6]/10">
        <h2 className="font-pixel text-xs text-[#9B59B6] uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          MESSAGES
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Group Chats */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono text-[#1ABC9C] uppercase tracking-widest flex items-center gap-2">
              <span className="text-[#1ABC9C]">═══</span>
              <Users className="w-3 h-3" />
              GROUPS
              <span className="text-[#1ABC9C]">═══</span>
            </div>
            <div className="space-y-1 mt-2">
              {groups.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => onSelect(convo.id)}
                  className={cn(
                    "w-full p-2 text-left transition-all font-mono text-sm",
                    "border border-transparent hover:border-[#1ABC9C] hover:bg-[#1ABC9C]/5",
                    activeId === convo.id && "border-[#1ABC9C] bg-[#1ABC9C]/10 shadow-[0_0_10px_rgba(26,188,156,0.3)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-[#1ABC9C]">#{convo.name}</span>
                    </div>
                    {convo.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-[#E74C3C] text-[#0a0a0a] text-[10px] font-bold">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#1ABC9C]/50 mt-1 truncate">
                    {convo.lastMessage}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ASCII Divider */}
          <div className="text-center text-[10px] text-[#9B59B6]/50 font-mono">
            ════════════════════
          </div>

          {/* Direct Messages */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono text-[#9B59B6] uppercase tracking-widest flex items-center gap-2">
              <span className="text-[#9B59B6]">═══</span>
              <MessageSquare className="w-3 h-3" />
              DIRECT
              <span className="text-[#9B59B6]">═══</span>
            </div>
            <div className="space-y-1 mt-2">
              {dms.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => onSelect(convo.id)}
                  className={cn(
                    "w-full p-2 text-left transition-all font-mono text-sm",
                    "border border-transparent hover:border-[#9B59B6] hover:bg-[#9B59B6]/5",
                    activeId === convo.id && "border-[#9B59B6] bg-[#9B59B6]/10 shadow-[0_0_10px_rgba(155,89,182,0.3)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Circle
                        className={cn(
                          "w-2 h-2 flex-shrink-0",
                          convo.isOnline ? "text-[#1ABC9C] fill-[#1ABC9C]" : "text-[#555]"
                        )}
                      />
                      <span className="truncate text-[#9B59B6]">@{convo.name}</span>
                    </div>
                    {convo.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-[#9B59B6] text-[#0a0a0a] text-[10px] font-bold">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[#9B59B6]/50 truncate flex-1">
                      {convo.lastMessage}
                    </span>
                    <span className="text-[8px] text-[#555] ml-2">
                      {formatTime(convo.lastActivity)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Status */}
      <div className="p-2 border-t-2 border-[#9B59B6] bg-[#9B59B6]/5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#9B59B6]/70">
          <Circle className="w-2 h-2 text-[#1ABC9C] fill-[#1ABC9C] animate-pulse" />
          <span>CONNECTED</span>
          <span className="text-[#555]">|</span>
          <span>SOCKET.IO: OK</span>
        </div>
      </div>
    </div>
  );
};

