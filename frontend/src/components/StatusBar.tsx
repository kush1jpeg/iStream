import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  className?: string;
}

export const StatusBar = ({ className }: StatusBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const stats = [
    { label: "ONLINE", value: "847", color: "text-terminal-green" },
    { label: "STREAMS", value: "23", color: "text-vhs-purple" },
    { label: "VIEWERS", value: "12.4K", color: "text-vhs-cyan" },];

  return (
    <div className={cn("bg-card border-2 border-primary p-3 font-mono text-xs", className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-muted-foreground">{stat.label}:</span>
              <span className={cn("font-bold", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse shadow-glow" />
          <span className="text-terminal-green uppercase">System OK</span>
        </div>
      </div>
    </div>
  );
};
