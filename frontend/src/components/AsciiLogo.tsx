import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AsciiLogoProps {
  className?: string;
}

export const AsciiLogo = ({ className }: AsciiLogoProps) => {
  const [glitchLine, setGlitchLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchLine(Math.floor(Math.random() * 6));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const lines = [
    "██╗███████╗████████╗██████╗ ███████╗█████╗   ███╗   ███╗",
    "    ██╔════╝╚═██╔══╝██╔══██╗██╔════ ██╔══██╗ ████╗ ████║",
    "██║███████╗   ██║   ██████╔╝█████╗  ███████║  ██╔████╔██║",
    "██║╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║  ██║╚██╔╝██║",
    "██║███████║   ██║   ██║  ██║███████╗██║   ██║  ██║ ╚═╝██║",
    "╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ╚═╝     ╚═╝",
  ];

  return (
    <>
      <pre className={cn("font-mono text-xs md:text-sm leading-tight", className)}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "transition-all duration-100",
              glitchLine === i && "text-vhs-pink animate-glitch"
            )}
            style={{
              textShadow: glitchLine === i ? "2px 2px hsl(var(--vhs-cyan)), -2px -2px hsl(var(--vhs-purple))" : "none"
            }}
          >
            {line}
          </div>
        ))}
        <p className="hero-tagline">Broadcasting a Retro Future</p>
      </pre>

    </>
  );
};
