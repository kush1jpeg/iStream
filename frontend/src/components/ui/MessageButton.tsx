import { MessageSquareDot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MessageButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/direct/inbox`)}
      className="
        relative
        w-12 h-12
        flex items-center justify-center
        rounded-xl
        border border-purple-500/40
        text-purple-400
        hover:text-purple-200
        hover:border-purple-400
        transition-colors
        group
      "
    >
      {/* subtle activity ring */}

      <MessageSquareDot className="w-5 h-5 z-10" />
    </button>
  );
};


