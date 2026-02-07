import { cn } from "@/lib/utils";
import { Message } from "@/pages/Chat";
import { Check, CheckCheck, Edit2, Trash2 } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const ChatMessage = ({ message, isOwn, onEdit, onDelete }: ChatMessageProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };


  // Read receipt indicator
  const ReadReceipt = () => {
    if (!isOwn) return null;

    if (message.readBy.length > 0) {
      return (
        <CheckCheck className="w-3 h-3 text-[#1ABC9C]" />
      );
    }
    return (
      <Check className="w-3 h-3 text-[#555]" />
    );
  };

  return (
    <div
      className={cn(
        "group py-1.5 px-2 hover:bg-[#1ABC9C]/5 transition-colors",
        message.isStreamer && "border-l-2 border-[#9B59B6] bg-[#9B59B6]/5"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Pixel Avatar */}
        <div
          className={cn(
            "w-6 h-6 flex-shrink-0 border flex items-center justify-center text-[10px] font-bold",
            message.isStreamer
              ? "border-[#9B59B6] bg-[#9B59B6]/20 text-[#9B59B6]"
              : "border-[#1ABC9C] bg-[#1ABC9C]/10 text-[#1ABC9C]"
          )}
        >
          {message.senderName.charAt(0).toUpperCase()}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={cn(
                "font-mono text-sm font-bold",
                message.isStreamer ? "text-[#9B59B6]" : "text-[#1ABC9C]",
                isOwn && "text-[#E74C3C]"
              )}
            >
              {isOwn ? "you" : message.senderName}
            </span>
            {message.isStreamer && (
              <span className="px-1 py-0.5 bg-[#9B59B6] text-[#0a0a0a] text-[8px] font-bold uppercase">
                STREAMER
              </span>
            )}
            <span className="text-[10px] font-mono text-[#555]">
              {formatTime(message.timestamp)}
            </span>
          </div>

          <p className="font-mono text-sm text-[#ccc] mt-0.5 break-words">
            {message.content}
          </p>

          {/* Read Receipt & Actions Row */}
          <div className="flex items-center gap-2 mt-1">
            <ReadReceipt />

            {message.readBy.length > 0 && isOwn && (
              <span className="text-[8px] font-mono text-[#555]">
                seen by {message.readBy.length}
              </span>
            )}

            {/* Edit/Delete Actions (only for own messages) */}
            {isOwn && !message.isSystem && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto">
                <button
                  onClick={onEdit}
                  className="p-1 hover:bg-[#1ABC9C]/20 text-[#555] hover:text-[#1ABC9C] transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 hover:bg-[#E74C3C]/20 text-[#555] hover:text-[#E74C3C] transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

