import { Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  streamData: { streamId: string; title?: string } | null;
  autoRedirectMs?: number;
}

const LINES = [
  "initializing broadcast node...",
  "verifying stream credentials...",
  "allocating ffmpeg worker...",
  "opening HLS segment pipeline...",
  "stream verified - routing to dashboard",
];

export default function StreamRedirect({
  streamData,
  autoRedirectMs = 4000,
}: Props) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(
    Math.round(autoRedirectMs / 1000)
  );
  const [barWidth, setBarWidth] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // stagger log lines
  useEffect(() => {
    LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
        if (i === LINES.length - 1) setDone(true);
      }, i * 520);
    });
  }, []);

  // progress bar + countdown
  useEffect(() => {
    const step = 50;
    const totalSteps = autoRedirectMs / step;
    let current = 0;
    intervalRef.current = setInterval(() => {
      current++;
      setBarWidth(Math.min((current / totalSteps) * 100, 100));
      setCountdown(
        Math.max(Math.ceil(((totalSteps - current) / totalSteps) * (autoRedirectMs / 1000)), 0)
      );
      if (current >= totalSteps) {
        clearInterval(intervalRef.current!);
        if (streamData?.streamId) {
          window.location.href = `/stream/${streamData.streamId}/dashboard`;
        }
      }
    }, step);
    return () => clearInterval(intervalRef.current!);
  }, [autoRedirectMs, streamData]);

  const href = `/stream/${streamData?.streamId}/dashboard`;

  return (
    <div className="sr-root">
      {/* scanline overlay */}
      <div className="sr-scanlines" aria-hidden="true" />

      {/* noise grain */}
      <div className="sr-grain" aria-hidden="true" />

      <div className="sr-card">
        {/* logo */}
        <div className="sr-logo-row">
          <img
            src="/public/icon.png"
            alt="iStream"
            className="sr-logo-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <Radio className="w-8 h-8 text-primary" />
          <span className="sr-logo-text">iSTREAM</span>
          <span className="sr-live-badge">● LIVE</span>
        </div>

        {/* title if present */}
        {streamData?.title && (
          <p className="sr-stream-title">&gt; {streamData.title}</p>
        )}

        {/* terminal log */}
        <div className="sr-terminal" role="log" aria-live="polite">
          <div className="sr-terminal-header">
            <span className="sr-dot red" />
            <span className="sr-dot yellow" />
            <span className="sr-dot green" />
            <span className="sr-terminal-title">broadcast.init</span>
          </div>
          <div className="sr-terminal-body">
            {visibleLines.map((line, i) => (
              <div key={i} className="sr-log-line">
                <span className="sr-prompt">$&nbsp;</span>
                <span className={i === visibleLines.length - 1 && done ? "sr-line-done" : "sr-line-text"}>
                  {line}
                </span>
              </div>
            ))}
            {!done && (
              <div className="sr-log-line">
                <span className="sr-prompt">$&nbsp;</span>
                <span className="sr-cursor">█</span>
              </div>
            )}
          </div>
        </div>

        {/* progress bar */}
        <div className="sr-progress-wrap" aria-label={`Redirecting in ${countdown} seconds`}>
          <div className="sr-progress-track">
            <div className="sr-progress-fill" style={{ width: `${barWidth}%` }} />
          </div>
          <span className="sr-progress-label">
            redirecting in {countdown}s
          </span>
        </div>

        {/* redirect message + CTA */}
        <div className="sr-footer">
          <p className="text-terminal-green font-mono text-sm sr-redir-text">
            Redirecting to dashboard...
          </p>
          <a
            href={href}
            className="sr-cta inline-block border border-terminal-green text-terminal-green font-mono text-xs px-4 py-2 hover:bg-terminal-green hover:text-background transition-colors"
          >
            Go Now →
          </a>
        </div>
      </div>
    </div>
  );
}
