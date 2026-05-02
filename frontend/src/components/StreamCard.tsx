import { useStreamDuration } from "@/hooks/use-StreamDuration";
import { cn } from "@/lib/utils";
import { Radio, Users, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface StreamCardProps {
  id: string;
  title: string;
  streamer: string;
  viewers: number;
  thumbnail?: string;
  isLive?: boolean;
  startedAt: string | Date;
  className?: string;
  colorAccent?: "green" | "purple" | "cyan" | "pink";
}



export const StreamCard = ({
  id,
  title,
  streamer,
  viewers,
  thumbnail,
  isLive = true,
  colorAccent = "green",
  startedAt,
  className
}: StreamCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const accentColors = {
    green: "border-terminal-green shadow-[4px_4px_0px_hsl(var(--terminal-green-dim))]",
    purple: "border-vhs-purple shadow-[4px_4px_0px_hsl(280_80%_40%)]",
    cyan: "border-vhs-cyan shadow-[4px_4px_0px_hsl(180_80%_40%)]",
    pink: "border-vhs-pink shadow-[4px_4px_0px_hsl(320_80%_45%)]",
  };

  const accentGlow = {
    green: "shadow-[0_0_20px_hsl(var(--terminal-green)/0.6)]",
    purple: "shadow-[0_0_20px_hsl(var(--vhs-purple)/0.6)]",
    cyan: "shadow-[0_0_20px_hsl(var(--vhs-cyan)/0.6)]",
    pink: "shadow-[0_0_20px_hsl(var(--vhs-pink)/0.6)]",
  };

  const duration = useStreamDuration(startedAt);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/stream/${id}`)}
      className={cn(
        "relative bg-card border-2 p-4 cursor-pointer transition-all duration-200",
        "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        accentColors[colorAccent],
        isHovered && accentGlow[colorAccent],
        className
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        "relative aspect-video bg-muted mb-3 border-2 overflow-hidden film-grain transition-all duration-300",
        isHovered ? `border-${colorAccent === 'green' ? 'terminal-green' : colorAccent === 'purple' ? 'vhs-purple' : colorAccent === 'cyan' ? 'vhs-cyan' : 'vhs-pink'}` : "border-primary"
      )}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className={cn("w-full h-full object-cover transition-transform duration-300", isHovered && "scale-105")} />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center scanlines transition-all", isHovered && "animate-pulse")}>
            <Radio className={cn("w-12 h-12 transition-all",
              colorAccent === 'green' && "text-terminal-green",
              colorAccent === 'purple' && "text-vhs-purple",
              colorAccent === 'cyan' && "text-vhs-cyan",
              colorAccent === 'pink' && "text-vhs-pink",
              isHovered && "scale-110"
            )} />
          </div>
        )}

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-destructive border-2 border-foreground flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            <span className="text-xs font-pixel uppercase">Live</span>
          </div>
        )}

        {/* Viewer Count */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/90 border border-primary flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span className="text-xs">{viewers}</span>
          <p>[ UPTIME: {duration} ]</p>
        </div>
      </div>

      {/* Stream Info */}
      <div className="space-y-2">
        <h3 className={cn(
          "font-pixel text-xs leading-relaxed transition-all duration-200",
          isHovered && colorAccent === 'green' && "text-terminal-green",
          isHovered && colorAccent === 'purple' && "text-vhs-purple",
          isHovered && colorAccent === 'cyan' && "text-vhs-cyan",
          isHovered && colorAccent === 'pink' && "text-vhs-pink"
        )}>
          {title}
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">{streamer}</span>
        </div>
      </div>
    </div>
  );
};
