import { VideoPlayer } from "@/components/VideoPlayer";
import { RetroContainer } from "@/components/RetroContainer";
import { api } from "@/App";
import { Calendar, Clock3, Eye, HardDrive, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PurpleAngelVodDetails } from "@/components/ui/vodDetails";
import { MoreFromStreamer, type VodSummary } from "@/components/MoreFromStreamer";

const NGINX_ORIGIN = import.meta.env.VITE_NGINX_ORIGIN

interface VodDetails {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  viewers: number;
  views: number;
  startedAt: string;
  endedAt: string;
  streamer: {
    _id: string;
    username: string;
    avatar: string
  };
  VOD_PATH: string;
  moreVods: VodSummary[];
};


function formatDuration(startedAt?: string, endedAt?: string) {
  if (!startedAt || !endedAt) return "0m";

  const diff = Math.max(
    new Date(endedAt).getTime() - new Date(startedAt).getTime(),
    0,
  );
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDate(value?: string) {
  if (!value) return "unknown";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAvatarUrl(avatar: VodDetails["streamer"]["avatar"]) {
  if (typeof avatar === "string") return avatar;;
}

const VodPage = () => {
  const { vodId } = useParams();
  const [loading, setLoading] = useState(true);
  const [vod, setVod] = useState<VodDetails | null>(null);

  useEffect(() => {
    api
      .get(`stream/vod/${vodId}`)
      .then(({ data }) => setVod(data.vod))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vodId]);

  console.log(vod);
  if (loading)
    return (
      <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-vhs-purple animate-pulse" />
            <div className="w-2 h-2 bg-vhs-cyan animate-pulse" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-vhs-pink animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="font-mono text-xs text-muted-foreground animate-pulse uppercase tracking-widest">
            loading archive...
          </span>
        </div>
      </div>
    );

  if (!vod)
    return (
      <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
        <p className="font-mono text-xs text-destructive uppercase tracking-widest">
          [ERROR] archive not found
        </p>
      </div>
    );

  return (
    <div className="h-screen overflow-y-auto bg-background crt-container film-grain pl-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <main className="mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer
              streamUrl={`${NGINX_ORIGIN}${vod.VOD_PATH}`}
              thumbnail={vod.thumbnail}
              autoPlay={false}
            />
            <PurpleAngelVodDetails
              vod={vod}
              getAvatarUrl={getAvatarUrl}
            />
          </div>

          <div className="space-y-6">
            <RetroContainer>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 border-b-2 border-b-slate-800 pb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-vhs-pink" />
                      <span className="font-pixel text-s uppercase tracking-wider text-primary">
                        Archive Details
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      tape:{vod._id.slice(-8)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-primary/40 bg-background/40 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5 text-vhs-cyan" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">
                        Views
                      </span>
                    </div>
                    <p className="mt-2 font-pixel text-lg text-vhs-cyan">
                      {vod.views}
                    </p>
                  </div>

                  <div className="border border-primary/40 bg-background/40 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-3.5 h-3.5 text-vhs-purple" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">
                        Peak
                      </span>
                    </div>
                    <p className="mt-2 font-pixel text-lg text-vhs-purple">
                      {vod.viewers}
                    </p>
                  </div>

                  <div className="border border-primary/40 bg-background/40 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 className="w-3.5 h-3.5 text-terminal-green" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">
                        Length
                      </span>
                    </div>
                    <p className="mt-2 font-pixel text-sm text-terminal-green">
                      {formatDuration(vod.startedAt, vod.endedAt)}
                    </p>
                  </div>

                  <div className="border border-primary/40 bg-background/40 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-vhs-pink" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">
                        Date
                      </span>
                    </div>
                    <p className="mt-2 font-pixel text-[10px] leading-5 text-vhs-pink">
                      {formatDate(vod.startedAt)}
                    </p>
                  </div>
                </div>

                <div className="border-y border-dashed border-primary/40 py-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <HardDrive className="w-3.5 h-3.5 text-vhs-cyan" />
                    R2 Playback Source
                  </div>
                  <p className="mt-2 truncate border border-vhs-purple/40 bg-background/50 px-2 py-1.5 font-mono text-[13px] text-vhs-purple">
                    {vod.VOD_PATH}
                  </p>
                </div>
              </div>
            </RetroContainer>
            <MoreFromStreamer
              vods={vod.moreVods ?? []}
              streamerUsername={vod.streamer.username}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VodPage;
