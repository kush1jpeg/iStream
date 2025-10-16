import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { RetroContainer } from "./RetroContainer";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  streamUrl?: string;
  title: string;
}

export const VideoPlayer = ({ streamUrl, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play();
        setIsPlaying(true);
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
        setIsPlaying(true);
      });
    }
  }, [streamUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <RetroContainer variant="chunky" className="overflow-hidden">
      {/* Title Bar */}
      <div className="bg-primary text-primary-foreground px-3 py-2 mb-3 -mx-4 -mt-4 border-b-2 border-primary flex items-center justify-between">
        <span className="font-pixel text-xs uppercase tracking-wider">{title}</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 border-2 border-primary-foreground" />
          <div className="w-3 h-3 border-2 border-primary-foreground" />
          <div className="w-3 h-3 border-2 border-primary-foreground bg-primary-foreground" />
        </div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video bg-background border-2 border-primary overflow-hidden crt-container vhs-effect film-grain">
        <video
          ref={videoRef}
          className="w-full h-full scanlines"
          playsInline
        >
          Your browser does not support the video tag.
        </video>

        {/* VHS Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20" />

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 border-2 border-primary bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-muted border-2 border-primary relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-vhs animate-pulse" style={{ width: "45%" }} />
            </div>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-2 border-2 border-primary bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 border-2 border-primary bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </RetroContainer>
  );
};
