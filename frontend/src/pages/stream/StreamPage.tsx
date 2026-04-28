import { Navigation } from "@/components/Navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { GlitchText } from "@/components/GlitchText";
import { Users, Eye, Signal } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";
import { ChatBox } from "@/components/LiveChatBox";

const StreamPage = () => {
  return (
    <div className="min-h-screen bg-background crt-container film-grain">
      <Navigation />

      <main className=" mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer
              title="Late Night Coding Session"
            // streamUrl will be provided by your Go backend
            />

            {/* Stream Info */}
            <RetroContainer variant="terminal" glow>
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <GlitchText
                    text="Late Night Coding Session"
                    as="h1"
                    className="text-lg font-pixel mb-2"
                  />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>terminal_wizard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>1,337 watching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Signal className="w-4 h-4 text-destructive animate-pulse" />
                      <span className="text-destructive font-mono uppercase text-xs">Live</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-4 border-t-2 border-primary">
                  <p className="font-mono text-sm leading-relaxed">
                    Building a retro terminal emulator in Rust. Expect VHS glitches,
                    analog artifacts, and occasional signal loss. This is what happens
                    when you broadcast from a basement server rack powered by nostalgia.
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {["#coding", "#retro", "#rust", "#terminal", "#latenight"].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted border border-primary text-xs font-mono hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </RetroContainer>
          </div>

          <ChatBox />
        </div>
      </main>
    </div>
  );
};

export default StreamPage;
