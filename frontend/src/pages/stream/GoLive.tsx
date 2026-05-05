import { useState } from "react";
import { RetroContainer } from "@/components/RetroContainer";
import { GlitchText } from "@/components/GlitchText";
import { Signal, Copy, Check, Radio, ChevronRight, Loader } from "lucide-react";
import { api } from "@/App";
import { Footer } from "@/components/Footer";


type Step = "initiate" | "ready" | "live";

interface StreamData {
  streamId: string;
  streamKey: string;
  rtmpUrl: string;
  title: string;
  tags: string[]; thumbnail?: string;
}

export default function GoLive() {
  const [step, setStep] = useState<Step>("initiate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [copied, setCopied] = useState<"key" | "url" | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
    thumbnail: "",
  });

  const handleInitiate = async () => {
    if (!form.title || !form.tags) {
      setError("Title and tags are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/api/stream/initiate", {
        title: form.title,
        description: form.description,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        thumbnail: form.thumbnail || undefined,
      });
      setStreamData(data);
      setStep("ready");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    if (!streamData) return;
    setLoading(true);
    setError(null);
    try {
      // await api.post("/api/stream/start", { streamId: streamData?.streamId });
      setStep("live");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "key" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background crt-container film-grain">
      <main className="container mx-auto px-4 mb-10 py-10 max-w-2xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-destructive animate-pulse" />
          <GlitchText
            text="Go Live"
            as="h1"
            className="font-pixel text-xl text-primary uppercase tracking-wider"
          />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-vhs-purple to-transparent opacity-50" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {(["initiate", "ready", "live"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`px-2 py-1 border ${step === s
                ? "border-terminal-green text-terminal-green"
                : i < ["initiate", "ready", "live"].indexOf(step)
                  ? "border-vhs-purple text-vhs-purple"
                  : "border-muted-foreground text-muted-foreground opacity-40"
                }`}>
                {i + 1}. {s.toUpperCase()}
              </span>
              {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground opacity-40" />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Initiate */}
        {step === "initiate" && (
          <RetroContainer variant="terminal" className="space-y-4">
            <p className="font-mono text-xs text-terminal-green">
              <span className="text-vhs-purple">$</span> stream --initiate
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Late Night Kernel Dev..."
                  className="w-full bg-background border border-primary font-mono text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terminal-green"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What are you building tonight..."
                  rows={3}
                  className="w-full bg-background border border-primary font-mono text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terminal-green resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Tags <span className="text-destructive">*</span>
                  <span className="text-muted-foreground normal-case ml-2">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="c, kernel, linux, lld..."
                  className="w-full bg-background border border-primary font-mono text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terminal-green"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-background border border-primary font-mono text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terminal-green"
                />
              </div>
            </div>

            {error && (
              <p className="font-mono text-xs text-destructive border border-destructive px-3 py-2">
                [ERROR] {error}
              </p>
            )}

            <button
              onClick={handleInitiate}
              disabled={loading}
              className="w-full border-2 border-terminal-green text-terminal-green font-mono text-sm py-3 uppercase tracking-wider hover:text-purple-100 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Initializing...</>
              ) : (
                <><Signal className="w-4 h-4" /> Initialize Stream</>
              )}
            </button>
          </RetroContainer>
        )}

        {/* STEP 2 — Ready (show stream key) */}
        {step === "ready" && streamData && (
          <div className="space-y-4">
            <RetroContainer className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-terminal-green animate-pulse" />
                <p className="font-mono text-xs text-terminal-green uppercase tracking-wider">
                  Stream Initialized — Copy your key now
                </p>
              </div>

              <p className="font-mono text-xs text-destructive border border-destructive px-3 py-2">
                [WARNING] Stream key will not be shown again. Store it securely.
              </p>

              {/* Stream Key */}
              <div className="space-y-1">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Stream Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-vhs-purple px-3 py-2 font-mono text-xs text-vhs-purple truncate select-all">
                    {streamData.streamKey}
                  </div>
                  <button
                    onClick={() => copyToClipboard(streamData.streamKey, "key")}
                    className="border border-vhs-purple text-vhs-purple p-2 hover:bg-vhs-purple hover:text-background transition-colors"
                  >
                    {copied === "key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* RTMP URL */}
              <div className="space-y-1">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  RTMP URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-vhs-cyan px-3 py-2 font-mono text-xs text-vhs-cyan truncate">
                    {streamData.rtmpUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(streamData.rtmpUrl, "url")}
                    className="border border-vhs-cyan text-vhs-cyan p-2 hover:bg-vhs-cyan hover:text-background transition-colors"
                  >
                    {copied === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-primary pt-3 font-mono text-xs text-muted-foreground space-y-1">
                <p><span className="text-terminal-green">{'>'}</span> Open OBS → Settings → Stream</p>
                <p><span className="text-terminal-green">{'>'}</span> Service ::  paste RTMP URL + stream key</p>
                <p><span className="text-terminal-green">{'>'}</span> Start streaming in OBS, then hit Go Live below</p>
              </div>
            </RetroContainer>

            {error && (
              <p className="font-mono text-xs text-destructive border border-destructive px-3 py-2">
                [ERROR] {error}
              </p>
            )}

            <button
              onClick={handleGoLive}
              disabled={loading}
              className="w-full border-2 border-destructive text-destructive font-mono text-sm py-3 uppercase tracking-wider hover:bg-destructive hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Starting...</>
              ) : (
                <><Radio className="w-4 h-4 animate-pulse" /> Go Live</>
              )}
            </button>
          </div>
        )}

        {/* STEP 3 — Live */}
        {step === "live" && (
          <RetroContainer variant="terminal" className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse shadow-glow" />
              <GlitchText
                text="YOU ARE LIVE"
                as="h2"
                className="font-pixel text-2xl text-destructive"
              />
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse shadow-glow" />
            </div>

            <div className="font-mono text-xs text-muted-foreground space-y-1">
              <p><span className="text-terminal-green">{'>'}</span> Stream is broadcasting</p>
              <p><span className="text-terminal-green">{'>'}</span> Title: <span className="text-foreground">{streamData?.title}</span></p>
              <p><span className="text-terminal-green">{'>'}</span> ID: <span className="text-vhs-cyan">{streamData?.streamId}</span></p>
            </div>

            <a
              href={`/stream/${streamData?.streamId}`}
              className="inline-block border border-terminal-green text-terminal-green font-mono text-xs px-4 py-2 hover:bg-terminal-green hover:text-background transition-colors"
            >
              View Stream Page →
            </a>
          </RetroContainer>
        )}

      </main>

      <Footer />
    </div>
  );
}
