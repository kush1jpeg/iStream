import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { RetroContainer } from "./RetroContainer";
import { Play, Pause, Volume2, VolumeX, Maximize, Volume1 } from "lucide-react";

interface VideoPlayerProps {
  streamUrl?: string;
}

export const VideoPlayer = ({ streamUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolume, setShowVolume] = useState(false);
  const prevVolume = useRef(0.5);

  const [levels, setLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [showRes, setShowRes] = useState(true);
  const hlsRef = useRef<Hls | null>(null);



  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        videoRef.current?.play();
        setIsPlaying(true);
        setLevels(data.levels.map((l, i) => ({ height: l.height, index: i })));
      });
      return () => hls.destroy();
    }
  }, [streamUrl]);

  const changeLevel = (index: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
    setCurrentLevel(index);
    setShowRes(false);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume.current);
    } else {
      prevVolume.current = volume;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    prevVolume.current = val || prevVolume.current;
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!isFullscreen) videoRef.current.requestFullscreen();
    else document.exitFullscreen();
    setIsFullscreen(!isFullscreen);
  };

  const volIcon = isMuted || volume === 0
    ? <VolumeX className="w-5 h-5" />
    : volume < 0.5
      ? <Volume1 className="w-5 h-5" />
      : <Volume2 className="w-5 h-5" />;

  return (
    <RetroContainer variant="chunky" className="overflow-hidden">
      {/* Video */}
      <div className="relative aspect-video bg-background border-2 border-primary overflow-hidden crt-container vhs-effect film-grain">
        <video ref={videoRef} className="w-full h-full scanlines" playsInline>
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20" />

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
          <div className="flex items-center gap-4">

            {/* Play */}
            <button onClick={togglePlay} className="p-2 border-2 border-primary bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Progress */}
            <div className="flex-1 h-2 bg-muted border-2 border-primary relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-vhs animate-pulse" style={{ width: "45%" }} />
            </div>

            {/* Volume */}
            <div
              className="relative flex h-2 w-10 items-center"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              {/* slider floats above — doesn't affect layout */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 select-none mb-3 flex flex-col items-center gap-1 transition-all duration-200 ${showVolume ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {Math.round((isMuted ? 0 : volume) * 100)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>

              <button
                onClick={toggleMute}
                className="p-2 border-2 border-primary z-10 bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
              >
                {volIcon}
              </button>
            </div>

            {/* Resolution */}
            {levels.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setShowRes(true)}
                onMouseLeave={() => setShowRes(false)}
              >
                <button className="p-2.5 m-2 border-2 border-primary bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none font-mono text-[10px]">
                  {currentLevel === -1 ? "AUTO" : `${levels[currentLevel]?.height}p`}
                </button>

                <div className={`absolute p-1 bottom-full  border-2 border-primary bg-card flex flex-col transition-all duration-200 ${showRes ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                  <button
                    onClick={() => changeLevel(-1)}
                    className={`px-4 py-1.5 font-mono text-[13px] text-left  hover:bg-primary hover:text-primary-foreground transition-colors ${currentLevel === -1 ? "text-vhs-purple" : "text-foreground"}`}
                  >
                    AUTO
                  </button>
                  {levels.map((l) => (
                    <button
                      key={l.index}
                      onClick={() => changeLevel(l.index)}
                      className={`px-4 py-1.5 font-mono text-[11px] text-left hover:bg-primary hover:text-primary-foreground transition-colors ${currentLevel === l.index ? "text-vhs-purple" : "text-foreground"}`}
                    >
                      {l.height}p
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-2 border-2 border-primary bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-chunky hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </RetroContainer>
  );
};
