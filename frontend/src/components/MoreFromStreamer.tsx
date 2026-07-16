import { useNavigate } from "react-router-dom";

export type VodSummary = {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  createdAt: string;
  duration: number;
};

interface MoreFromStreamerProps {
  vods: VodSummary[];
  streamerUsername: string;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "unknown date";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const units = [
    { label: "year", seconds: 31_536_000 },
    { label: "month", seconds: 2_592_000 },
    { label: "week", seconds: 604_800 },
    { label: "day", seconds: 86_400 },
    { label: "hour", seconds: 3_600 },
    { label: "minute", seconds: 60 },
  ];

  for (const unit of units) {
    const amount = Math.floor(elapsedSeconds / unit.seconds);
    if (amount >= 1) return `${amount} ${unit.label}${amount === 1 ? "" : "s"} ago`;
  }

  return "just now";
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${Math.max(1, minutes)}m`;
}

export const MoreFromStreamer = ({ vods, streamerUsername }: MoreFromStreamerProps) => {
  const navigate = useNavigate();

  return (
    <section>
      <div className="border-b border-primary/30 pb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-vhs-cyan" />
        <p className="font-pixel text-xs tracking-[0.2em] uppercase text-muted-foreground">
          More From
        </p>
        <span className="font-pixel text-lg text-vhs-cyan drop-shadow-[0_0_6px_hsl(var(--vhs-cyan)/0.65)]">
          @{streamerUsername}
        </span>
      </div>

      {vods.length === 0 ? (
        <p className="py-5 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          No other VODs yet
        </p>
      ) : (
        <div className="divide-y divide-primary/30">
          {vods.map((vod) => (
            <button
              key={vod._id}
              type="button"
              onClick={() => navigate(`/vod/${vod._id}`)}
              className="group flex w-full items-center gap-3 py-2 text-left transition-colors duration-200 hover:bg-primary/10"
            >
              <div className="relative aspect-video w-[168px] shrink-0 overflow-hidden bg-muted film-grain">
                <img
                  src={vod.thumbnail}
                  alt={vod.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-background/90 px-1.5 py-0.5 font-mono text-lg text-foreground shadow-sm">
                  {formatDuration(vod.duration)}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="line-clamp-2 font-mono text-sm font-bold leading-5 text-foreground transition-colors group-hover:text-vhs-purple">
                  {vod.title}
                </h3>
                <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap font-mono text-sm text-muted-foreground">
                  <span>{vod.views.toLocaleString()} views</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatRelativeTime(vod.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
