import { Navigation } from "@/components/Navigation";
import { StreamCard } from "@/components/StreamCard";
import { GlitchText } from "@/components/GlitchText";
import { StatusBar } from "@/components/StatusBar";
import { Signal, Wifi, Terminal, Code, Zap, Sparkles, Github, Linkedin, MessageCircle, Globe } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";

const Index = () => {
  // Mock stream data with color accents
  const streams = [
    {
      id: "1",
      title: "Late Night Coding Session",
      streamer: "terminal_wizard",
      viewers: 1337,
      isLive: true,
      colorAccent: "green" as const,
    },
    {
      id: "2",
      title: "Retro Game Development",
      streamer: "pixel_pusher",
      viewers: 892,
      isLive: true,
      colorAccent: "purple" as const,
    },
    {
      id: "3",
      title: "Analog Synth Jam",
      streamer: "vhs_beats",
      viewers: 2048,
      isLive: true,
      colorAccent: "cyan" as const,
    },
    {
      id: "4",
      title: "Building Forgotten Tech",
      streamer: "circuit_bender",
      viewers: 567,
      isLive: true,
      colorAccent: "pink" as const,
    },
    {
      id: "5",
      title: "Glitch Art Workshop",
      streamer: "data_mosher",
      viewers: 743,
      isLive: true,
      colorAccent: "green" as const,
    },
    {
      id: "6",
      title: "Cyberpunk Code Poetry",
      streamer: "net_runner",
      viewers: 1521,
      isLive: true,
      colorAccent: "purple" as const,
    },
  ];

  const badges = [
    { icon: Code, label: "Indie Devs", color: "text-terminal-green" },
    { icon: Terminal, label: "Terminal Junkies", color: "text-vhs-purple" },
    { icon: Zap, label: "Late Night Builds", color: "text-vhs-cyan" },
    { icon: Sparkles, label: "Pixel Perfect", color: "text-vhs-pink" },
  ];

  const followedUsers = [
    { id: "1", name: "Alice", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: true },
    { id: "2", name: "Bob", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: false },
  ];

  return (
    <div className="min-h-screen bg-background crt-container film-grain flex">

      <div className=" flex flex-col flex-1 overflow-y-auto">
        <Navigation />
        <main className=" container mx-auto px-4 py-8 space-y-8">
          {/* Status Bar */}
          <StatusBar className="animate-slide-in" />

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
                  <span className="text-terminal-green">{'>'}</span> Built by indie devs, for indie devs
                  <br />
                  <span className="text-vhs-cyan">{'>'}</span> <span className="text-accent flicker">Warning:</span> May contain analog artifacts & digital nostalgia
                </p>
              </div>

              {/* Indie Dev Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {badges.map((badge, i) => (
                  <RetroContainer
                    key={badge.label}
                    className="px-4 py-2 hover:scale-105 transition-transform cursor-pointer animate-slide-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-2">
                      <badge.icon className={`w-4 h-4 ${badge.color}`} />
                      <span className="text-xs font-mono uppercase">{badge.label}</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((stream, i) => (
                <div
                  key={stream.id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <StreamCard
                    id={stream.id}
                    title={stream.title}
                    streamer={stream.streamer}
                    viewers={stream.viewers}
                    isLive={stream.isLive}
                    colorAccent={stream.colorAccent}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t-2 border-primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Terminal Prompt */}
              <RetroContainer variant="terminal" className="col-span-1 md:col-span-2">
                <div className="font-mono text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-green">kushuvikas@gmail.com</span>
                    <span className="text-muted-foreground">~</span>
                    <span className="text-vhs-purple">$</span>
                    <span className="text-foreground">cat README.md</span>
                  </div>
                  <div className="text-muted-foreground pl-4 space-y-1">
                    <p>{'>'} adaptive bitrate streaming platform — built from scratch</p>
                    <p>{'>'} <span className="text-terminal-green">stack:</span> node.js, ffmpeg, mediamtx, rabbitmq, redis, docker, nginx</p>
                    <p>{'>'} <span className="text-vhs-purple">features:</span> abs transcoding, autoscaling workers, live chat, shop, superchat</p>
                    <p>{'>'} running on coffee & marlboro at 3am</p>
                    <p className="text-vhs-cyan">
                      {'>'}{" "}

                      <a href="mailto:kushuvikas@gmail.com"
                        className="italic hover:opacity-80 underline underline-offset-2"
                      >
                        hire me before someone else does — kushuvikas@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </RetroContainer>

              <RetroContainer className="space-y-3">
                <div className="font-mono text-xs space-y-3">

                  <a href="https://github.com/kush1jpeg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Github className="w-3 h-3" />
                      Github:
                    </span>
                    <span className="text-terminal-green">kush1jpeg</span>
                  </a>


                  <a href="https://www.linkedin.com/in/kushagra-gupta-dystopia/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Linkedin className="w-3 h-3" />
                      LinkedIn:
                    </span>
                    <span className="text-vhs-purple">kushagra-gupta</span>
                  </a>


                  <a href="https://discord.com/users/841708046799601704"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" />
                      Discord:
                    </span>
                    <span className="text-vhs-cyan">kush1jpeg</span>
                  </a>


                  <a href="https://kush1jpeg.github.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Blogs:
                    </span>
                    <span className="text-vhs-pink">kush1jpeg.github.io</span>
                  </a>
                </div>
              </RetroContainer>

            </div >

            <div className="text-center space-y-2 opacity-70">
              <p className="font-mono text-sm text-muted-foreground">
                iStream v1.0.0 - Analog Broadcast System
              </p>
              <div className="font-mono text-xs text-muted-foreground space-y-1">
                <p>[ SIGNAL STRENGTH: ████████░░ 80% ] [ LATENCY: ~42ms ] [ STATUS: OPERATIONAL ]</p>
                <p className="text-vhs-purple text-sm">
                  "In a world of polished corporate streams, we broadcast the beautifully broken"
                </p>
              </div>
            </div>
          </footer >
        </main >
      </div >
    </div >
  );
};

export default Index;
