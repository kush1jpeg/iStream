import { VideoPlayer } from "@/components/VideoPlayer";
import { GlitchText } from "@/components/GlitchText";
import { Users, Eye, Signal } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";
import { ChatBox } from "@/components/LiveChatBox";
import { Footer } from "@/components/Footer";
import { api } from "@/App";
import { useEffect, useState } from "react";
import { IStreamRedisFrontend } from "@istream/shared";
import { useParams } from "react-router-dom";

const StreamPage = () => {
  const { streamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<IStreamRedisFrontend | null>(null);

  // check for the istreamer to show the additional logs of redis pubsub
  useEffect(() => {
    api.get(`stream/${streamId}`)
      .then(({ data }) => setStream(data.stream))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [streamId]);

  console.log(stream)
  if (loading) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-vhs-purple animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-vhs-cyan animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-vhs-pink animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="font-mono text-xs text-muted-foreground animate-pulse uppercase tracking-widest">
          tuning broadcast...
        </span>
      </div>
    </div>
  );

  if (!stream) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <p className="font-mono text-xs text-destructive uppercase tracking-widest">
        [ERROR] broadcast not found
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background crt-container film-grain pl-16">

      <main className=" mx-auto px-4 py-6 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer streamUrl={stream.HLS_PATH} />

            {/* Stream Info */}
            <RetroContainer variant="terminal" glow>
              {/* Title */}
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 space-y-2">
                  <GlitchText
                    text={stream.stream.title}
                    as="h1"
                    className="text-lg font-pixel"
                  />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{String(stream.viewers)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Signal className="w-4 h-4 text-destructive animate-pulse" />
                      <span className="text-destructive font-mono uppercase text-xs">
                        Live
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end max-w-[40%]">
                  {stream.stream.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted border border-primary text-xs font-mono
                   hover:bg-primary hover:text-primary-foreground
                   transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

              </div>

              {/* Description */}
              <div className="pt-4 border-t-2 border-b-slate-800 flex items-start gap-6">
                <p className="font-mono text-sm leading-relaxed flex-1">
                  {stream.stream.description}
                </p>

                <a href={`user${stream.streamerId}`} className="flex flex-col items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
                  <img
                    src={stream.streamer.avatar}
                    alt={stream.streamerId}
                    className="w-14 h-14 rounded-full object-cover border-2 border-b-slate-800 opacity-100 brightness-125 hover:scale-105 transition-transform duration-150"
                  />
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">{stream.streamer.username}</span>
                  </div>
                </a>                </div>

            </RetroContainer>
          </div>

          <ChatBox />

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StreamPage;
