import { useState, useRef, useEffect } from "react";
import { RetroContainer } from "@/components/RetroContainer";
import { GlitchText } from "@/components/GlitchText";
import { Signal, Copy, Check, Radio, ChevronRight, Loader, Upload, Loader2, X } from "lucide-react";
import { api } from "@/App";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import StreamRedirect from "@/components/StreamRedirect";


type Step = "initiate" | "ready" | "live";

interface StreamData {
  streamId: string;
  streamKey: string;
  rtmpUrl: string;
  title: string;
  tags: string[];
  thumbnail: string;
}

// ─── uploadThumbnail ───────────────────────────────────────────────────────

const uploadThumbnail = async (file: File, streamId: string): Promise<string> => {
  try {
    const { data } = await api.get(
      `/user/get/signed-link?type=thumbnail`,
      { withCredentials: true }
    );

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", data.apiKey);
    formData.append("timestamp", String(data.timestamp));
    formData.append("signature", data.signature);
    formData.append("folder", data.folder);

    const cloudinaryURL = `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`;

    const uploadRes = await fetch(cloudinaryURL, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Cloudinary error: ${err}`);
    }

    const uploadData = await uploadRes.json();
    console.log("Cloudinary upload response:", uploadData);

    if (!uploadData?.secure_url || !uploadData?.public_id) {
      throw new Error("Invalid Cloudinary response");
    }

    await api.post(
      `/stream/upload/thumbnail`,
      { publicId: uploadData.public_id, streamId },
      { withCredentials: true }
    );

    return uploadData.secure_url;
  } catch (err) {
    console.error("THUMBNAIL UPLOAD FAILED:", err);
    throw err;
  }
};

export default function GoLive() {
  const [step, setStep] = useState<Step>("initiate");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [copied, setCopied] = useState<"key" | "url" | null>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
    thumbnail: "/thumbnail/miku.jpg", //default
  });

  const handleInitiate = async () => {
    if (!form.title || !form.tags) {
      setError("Title and tags are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/stream/initiate", {
        title: form.title,
        description: form.description,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      console.log(data.data)
      console.log("Stream initiated:", data);
      setStreamData({
        ...data.data,
      });
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
      await api.post("/stream/start", { streamId: streamData?.streamId, thumbnail: streamData.thumbnail }, { withCredentials: true });
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

  const defaultThumbs = [
    "/thumbnail/linux.jpg",
    "/thumbnail/reyna.jpg",
    "/thumbnail/anime.jpg",
    "/thumbnail/miku.jpg",
  ];

  const handleThumbnailUpload = async (file: File) => {
    if (!streamData) return;
    setUploading(true);
    try {
      const url = await uploadThumbnail(file, streamData.streamId);
      setStreamData((prev) => prev ? { ...prev, thumbnail: url } : prev);
    } catch (err: any) {
      setError(err.message || "Failed to upload thumbnail");
    } finally {
      setUploading(false);
    }
  };

  const navigate = useNavigate()
  useEffect(() => {
    if (step !== "live" || !streamData?.streamId) return;

    const timer = setTimeout(() => {
      navigate(`/stream/${streamData.streamId}/dashboard`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [step]);

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
            <RetroContainer className="space-y-4 bg-zinc-900 border-zinc-700">

              <div className="relative overflow-hidden border border-amber-500 bg-amber-500/10 px-4 py-3">

                {/* subtle animated strip */}
                <div className="absolute left-0 top-0 h-full w-1 bg-amber-500 animate-pulse" />
                <div className="flex items-start gap-3 pl-2">
                  <div className="text-amber-500 text-lg">
                    ⚠
                  </div>
                  <div className="space-y-1">
                    <p className="font-pixel text-[10px] tracking-widest text-amber-400 uppercase">
                      Warning
                    </p>
                    <p className="font-mono text-xs text-amber-200 leading-relaxed">
                      Stream key will not be shown again. Copy and store it securely before continuing.
                    </p>
                  </div>

                </div>
              </div>
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
                    className="border border-vhs-purple text-vhs-purple p-2 hover:bg-vhs-purple hover:text-green-600 transition-colors"
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
                    className="border border-vhs-cyan text-vhs-cyan p-2 hover:bg-vhs-cyan hover:text-green-600 transition-colors"
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

              {/* Thumbnail Upload */}
              {/* Thumbnail Section */}
              <div className="border-t border-primary pt-3 space-y-2">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Thumbnail
                </label>

                <div className="grid grid-cols-2 gap-3 h-44">

                  {/* Upload Side */}
                  <div
                    className="relative border border-primary bg-background/50 overflow-hidden cursor-pointer group hover:border-terminal-green transition-colors"
                    onClick={() => !uploading && thumbnailRef.current?.click()}
                  >
                    {streamData.thumbnail ? (
                      <>
                        <img
                          src={streamData.thumbnail}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                        />

                        {uploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-terminal-green" />
                          </div>
                        )}

                        {!uploading && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 flex flex-col items-center justify-center transition-opacity">
                            <Upload className="w-5 h-5 text-terminal-green mb-1" />
                            <span className="font-pixel text-[9px] text-terminal-green">
                              UPLOAD
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setStreamData(prev =>
                              prev
                                ? { ...prev, thumbnail: "/thumbnail/miku.jpg" }
                                : prev
                            );
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/70 border border-destructive"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-terminal-green" />
                        ) : (
                          <>
                            <div className="relative w-full h-full">
                              <img
                                src="/thumbnail/miku.jpg"
                                alt="default-thumbnail"
                                className="w-full h-full object-cover opacity-70"
                              />

                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                {uploading ? (
                                  <Loader2 className="w-6 h-6 text-terminal-green animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5 mb-2 text-terminal-green" />
                                    <span className="font-pixel text-[9px] tracking-widest text-terminal-green">
                                      CLICK TO UPLOAD
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preset Thumbnails Side */}
                  <div className="grid grid-cols-2 gap-2">
                    {defaultThumbs.map((thumb, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setStreamData(prev =>
                            prev
                              ? { ...prev, thumbnail: thumb }
                              : prev
                          )
                        }
                        className={cn(
                          "overflow-hidden rounded border hover:scale-[1.03] transition",
                          streamData?.thumbnail === thumb
                            ? "border-terminal-green"
                            : "border-zinc-700"
                        )}
                      >
                        <img
                          src={thumb}
                          className="w-full h-full object-cover"
                          alt={`preset-${i}`}
                        />
                      </button>
                    ))}
                  </div>

                  <input
                    ref={thumbnailRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        await handleThumbnailUpload(file);
                      }

                      if (thumbnailRef.current) {
                        thumbnailRef.current.value = "";
                      }
                    }}
                  />
                </div>
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
          <StreamRedirect streamData={streamData} autoRedirectMs={4000} />
        )}

      </main>

      <Footer />
    </div>
  );
}
