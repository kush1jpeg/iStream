import { StreamCard } from "@/components/StreamCard";
import { GlitchText } from "@/components/GlitchText";
import { StatusBar } from "@/components/StatusBar";
import { Signal, Video, Wifi } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";
import { useOnlineCount } from "@/hooks/updateStatusbar";
import { api } from "@/App";
import { useEffect, useMemo, useRef, useState } from "react";
import { IStreamRedisFrontend } from "@istream/shared";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";

export interface IVod {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  viewers: number;
  views: number;
  startedAt: string;
  endedAt: string;
  streamer: {
    _id: string;
    username: string;
    avatar: string;
  };
  VOD_PATH: string;
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("");
  const [streams, setStreams] = useState<IStreamRedisFrontend[]>([]);
  const [vods, setVods] = useState<IVod[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);

  const fetchHome = async (page: number, cursor: number) => {
    setLoading(true);
    try {
      const { data } = await api.get("stream/home", {
        params: { limit: 6, cursor, page }
      });
      console.log(data);
      setStreams(prev => cursor === 0 ? data.live.streams : [...prev, ...data.live.streams]);
      setVods(prev => cursor === 0 ? data.vod.vods : [...prev, ...data.vod.vods]);
      setHasMore(!!(data?.live.hasMore || data?.vod.hasMore));
      setCursor(data?.live?.nextCursor ?? null);
      setPage(data?.vod?.hasMore ? page + 1 : page);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // initial fetch
  useEffect(() => { fetchHome(0, 0); }, []);

  // intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchHome(page, cursor ?? 0);
        }
      },
      { threshold: 1.0 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor]);


  // derive tags from live streams
  const liveTags = useMemo(() => {
    const all = streams.flatMap(s => s.stream.tags || []);
    const unique = [...new Set(all)];
    return unique.slice(0, 4); // show max 4
  }, [streams]);


  // to display no of active people + streams
  const { count, streamCount } = useOnlineCount();

  return (
    <div className="min-h-screen bg-background crt-container film-grain flex">

      <div className=" flex flex-col flex-1 overflow-y-auto">
        <main className=" container mx-auto px-4 py-8  mb-12 space-y-8">
          {/* Status Bar */}
          <StatusBar count={count} streamCount={streamCount} className="animate-slide-in" />

          {/* Hero Section with ASCII Logo */}
          <div className="mb-12 space-y-6">
            <div className="flex flex-col items-center justify-center gap-6 p-8 scanlines">


              {/* Tagline */}
              <div className="text-center space-y-3 max-w-3xl">
                <div className="flex items-center justify-center gap-3">
                  <Wifi className="w-6 h-6 text-vhs-purple animate-pulse" />
                  <GlitchText
                    text="Independent Broadcast Network"
                    as="h2"
                    className="text-lg md:text-xl font-pixel text-vhs-purple"
                  />
                  <Wifi className="w-6 h-6 text-vhs-cyan animate-pulse" />
                </div>

                <p className="text-muted-foreground text-base md:text-lg font-mono leading-relaxed">
                  <span className="text-vhs-pink">{'>'}</span> Streaming from basements, garages & forgotten server racks
                  <br />
                  <span className="text-terminal-green">{'>'}</span> Built by an indie dev, for indie devs
                  <br />
                  <span className="text-vhs-cyan">{'>'}</span> <span className="text-accent flicker">Warning:</span> operations are subject to availability
                </p>
              </div>

              {/* Indie Dev Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {liveTags.map((tag, i) => (
                  <RetroContainer
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={cn(
                      "px-4 py-2 hover:scale-105 transition-transform cursor-pointer animate-slide-in",
                      activeTag === tag && "border-terminal-green shadow-glow"
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase">#{tag}</span>
                    </div>
                  </RetroContainer>
                ))}

              </div>
            </div>
          </div>

          {/* Live Streams Grid */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-primary">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive shadow-glow" />
                <Signal className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-pixel text-sm uppercase text-primary tracking-wider">
                Live Broadcasts
              </h3>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-vhs-purple to-vhs-cyan opacity-50" />
            </div>

            {loading ? (
              <div className="col-span-3 flex items-center justify-center py-16 gap-3">
                <div className="w-2 h-2 bg-vhs-purple animate-pulse" />
                <span className="font-mono text-xs text-muted-foreground animate-pulse uppercase tracking-wider">
                  fetching live broadcasts...
                </span>
                <div className="w-2 h-2 bg-vhs-purple animate-pulse" />
              </div>
            ) : streams.length === 0 ? (
              <div className=" text-center py-16">
                <p className="font-mono text-sm text-muted-foreground opacity-50 uppercase tracking-wider">
                  {'>'} no live broadcasts found
                </p>
              </div>
            ) : (
              <>
                {!hasMore && streams.length > 0 && (
                  <p className="font-mono text-xs text-muted-foreground opacity-50 uppercase tracking-widest">
                    {'>'} end of broadcasts
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {streams
                    .filter(s => activeTag ? s.stream.tags?.includes(activeTag) : true)
                    .map((stream, i) => (
                      <div
                        key={stream.streamerId}
                        className="animate-slide-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <StreamCard
                          id={stream.streamerId}
                          title={stream.stream.title}
                          streamer={stream.streamer.username}
                          avatar={stream.streamer.avatar}
                          viewers={String(stream.viewers)}
                          thumbnail={stream.stream.thumbnail}
                          startedAt={String(stream.createdAt)}
                        />
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-primary">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-vhs-cyan" />
              </div>

              <h3 className="font-pixel text-sm uppercase text-primary tracking-wider">
                Recent VODs
              </h3>

              <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-vhs-purple to-vhs-cyan opacity-50" />
            </div>

            {vods.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-mono text-sm text-muted-foreground opacity-50 uppercase tracking-wider">
                  {'>'} no vods found
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vods
                    .filter(v => (activeTag ? v.tags?.includes(activeTag) : true))
                    .map((vod, i) => (
                      <div
                        key={vod._id}
                        className="animate-slide-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <StreamCard
                          id={vod._id}
                          title={vod.title}
                          avatar={vod.streamer.avatar}
                          streamer={vod.streamer.username}
                          viewers={String(vod.views)}
                          thumbnail={vod.thumbnail}
                          startedAt={String(vod.startedAt)}
                          endedAt={String(vod.endedAt)}
                          type="vod"
                        />
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </main >
        <Footer />

      </div >
    </div >
  );
};

export default Index;
