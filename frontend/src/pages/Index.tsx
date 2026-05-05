import { StreamCard } from "@/components/StreamCard";
import { GlitchText } from "@/components/GlitchText";
import { StatusBar } from "@/components/StatusBar";
import { Signal, Wifi } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";
import { useOnlineCount } from "@/hooks/updateStatusbar";
import { api } from "@/App";
import { useEffect, useMemo, useRef, useState } from "react";
import { IStreamRedis } from "@/types/types";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";


const Index = () => {
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("");
  const [streams, setStreams] = useState<IStreamRedis[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchStreams = async (cur: number) => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/stream/live", {
        params: { limit: 6, cursor: cur }
      });
      setStreams(prev => cur === 0 ? data.streams : [...prev, ...data.streams]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor ?? cur);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // initial fetch
  useEffect(() => { fetchStreams(0); }, []);

  // intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchStreams(cursor);
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
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse shadow-glow" />
                <Signal className="w-5 h-5 text-destructive animate-pulse" />
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

                {streams
                  .filter(s => activeTag ? s.stream.tags?.includes(activeTag) : true)
                  .map((stream, i) => (
                    <div
                      key={stream.streamer.id}
                      className="animate-slide-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <StreamCard
                        id={stream.streamer.id}
                        title={stream.stream.title}
                        streamer={stream.streamer.username}
                        viewers={String(stream.viewers)}
                        thumbnail={stream.stream.thumbnail}
                        startedAt={stream.createdAt}
                      />
                    </div>
                  ))}
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
