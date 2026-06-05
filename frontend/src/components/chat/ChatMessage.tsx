import { cn } from "@/lib/utils";
import { Check, CheckCheck, Edit2, Trash2 } from "lucide-react";

interface ChatMessageProps {
  message: IMsg;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const ChatMessage = ({ message, isOwn, onEdit, onDelete }: ChatMessageProps) => {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  // Read receipt indicator
  const ReadReceipt = () => {
    if (!isOwn) return null;

    return message.readBy.length > 0 ? (
      <CheckCheck className="w-3 h-3 text-[#1ABC9C]" />
    ) : (
      <Check className="w-3 h-3 text-[#555]" />
    );
  };

  // Dynamic styles
  const containerClasses = cn(
    "group flex py-1.5 px-2 transition-colors",
    isOwn ? "justify-end" : "justify-start"
  );

  const messageBoxClasses = cn(
    "flex flex-col max-w-[70%] p-2 rounded-md break-words",
    isOwn
      ? "bg-[#1ABC9C]/20 border border-[#1ABC9C] text-[#0a0a0a] items-end"
      : "bg-[#9B59B6]/20 border border-[#9B59B6] text-[#ccc] items-start"
  );

  return (
    <div className={containerClasses}>
      <div className="w-6 h-6 flex-shrink-0 border flex items-center justify-center text-[10px] font-bold border-[#9B59B6] bg-[#9B59B6]/20 text-[#9B59B6] mr-2">
        {isOwn ? "pfp" : message.senderName.charAt(0).toUpperCase()}
      </div>

      <div className={messageBoxClasses}>
        <div className="flex gap-2">
          {isOwn && (
            <div className="flex items-center gap-1 mt-1 ml-auto">
              <ReadReceipt />
              {message.readBy.length > 0 && (
                <span className="text-[8px] font-mono text-[#555]">seen by {message.readBy}</span>
              )}

            </div>
          )}


          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn(
              "font-mono text-sm font-bold",
              isOwn ? "text-white" : "text-[#9B59B6]"
            )}>
              {isOwn ? "you" : message.senderName}
            </span>
            <span className="text-[10px] font-mono text-[#555]">{formatTime(message.timestamp)}</span>
          </div>

          {/* Delete actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2">
            <button
              onClick={onDelete}
              className="p-1 hover:bg-[#E74C3C]/20 text-[#555] hover:text-[#E74C3C] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="mt-1 font-mono text-sm text-slate-200">{message.content}</p>


      </div>

    </div>
  );
};

