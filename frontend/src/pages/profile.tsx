import { useEffect, useRef, useState } from "react";
import { GlitchText } from "@/components/GlitchText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Heart, Video, DollarSign, Calendar,
  Eye, Globe, Pencil, X, Check, Upload, Loader2, Signal, Trash2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { IPay, IStream, IUserFrontend } from "@istream/shared";
import { useAuthStore } from "@/components/zustand/zustand";
import { cn } from "@/lib/utils";
import { api } from "@/App";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";

// ─── EditModal ─────────────────────────────────────────────────────────────────

const EditModal = ({ user, onClose, onSave }: { user: IUserFrontend; onClose: () => void; onSave: (u: Partial<IUserFrontend>) => void }) => {
  const [form, setForm] = useState({
    username: user.username ?? "",
    bio: user.bio ?? "",
    websiteId: user.websiteId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`user/me`, form, { withCredentials: true });
      onSave(form);
      setUser(data.user);
      console.log(data.user)
      onClose();
    } catch { /* surface if needed */ }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 border-2 border-vhs-purple bg-background font-mono shadow-[0_0_40px_rgba(168,85,247,0.3)]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-vhs-purple/40 bg-vhs-purple/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-vhs-cyan animate-pulse" />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-vhs-pink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "USERNAME", name: "username", value: form.username },
            { label: "WEBSITE", name: "websiteId", value: form.websiteId },
          ].map(f => (
            <div key={f.name} className="space-y-1">
              <label className="text-[10px] text-vhs-cyan tracking-widest uppercase">{f.label}</label>
              <input name={f.name} value={f.value} onChange={handleChange}
                className="w-full bg-black/60 border border-vhs-purple/50 text-foreground text-sm px-3 py-2 focus:outline-none focus:border-vhs-cyan transition-colors font-mono" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-[10px] text-vhs-cyan tracking-widest uppercase">BIO</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
              className="w-full bg-black/60 border border-vhs-purple/50 text-foreground text-sm px-3 py-2 focus:outline-none focus:border-vhs-cyan resize-none transition-colors font-mono" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-vhs-purple/40">
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-pixel border border-vhs-pink/50 text-vhs-pink hover:bg-vhs-pink/10 transition-colors">
            CANCEL
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 text-xs font-pixel border border-vhs-cyan/50 text-vhs-cyan hover:bg-vhs-cyan/10 transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ImageUploadOverlay ────────────────────────────────────────────────────────

const ImageUploadOverlay = ({ onUpload, uploading, children, className = "", hint = "UPLOAD" }:
  { onUpload: (f: File) => Promise<void>; uploading: boolean; children: React.ReactNode; className?: string; hint?: string }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={() => !uploading && ref.current?.click()}>
      {children}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center bg-black/60 transition-opacity z-30 pointer-events-none">
        {uploading ? <Loader2 className="w-6 h-6 text-vhs-cyan animate-spin" /> : (
          <><Upload className="w-5 h-5 text-vhs-cyan mb-1" />
            <span className="font-pixel text-vhs-cyan text-[9px] tracking-widest">{hint}</span></>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); if (ref.current) ref.current.value = ""; }} />
    </div>
  );
};

// ─── uploadFile ────────────────────────────────────────────────────────────────

const uploadFile = async (
  file: File,
  type: "avatar" | "banner" | "group"
): Promise<string> => {
  try {
    const { data } = await api.get(
      `/user/get/signed-link?type=${type}`,
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

    if (!uploadData?.secure_url || !uploadData?.public_id) {
      throw new Error("Invalid Cloudinary response");
    }

    console.log("uploading to db")
    console.log(uploadData)

    await api.post(
      `/user/upload/?type=${type}`,
      { publicId: uploadData.public_id },
      { withCredentials: true }
    );

    return uploadData.secure_url;
  } catch (err) {
    console.error("UPLOAD PIPELINE FAILED:", err);
    throw err;
  }
};
// ─── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) => {
  const colors: Record<string, string> = {
    "vhs-purple": "border-vhs-purple/40 text-vhs-purple",
    "vhs-pink": "border-vhs-pink/40 text-vhs-pink",
    "vhs-cyan": "border-vhs-cyan/40 text-vhs-cyan",
    "terminal-green": "border-terminal-green/40 text-terminal-green",
  };
  return (
    <div className={cn("border bg-black/40 p-4 flex flex-col items-center gap-2 hover:bg-black/60 transition-colors", colors[color])}>
      <Icon className={cn("w-4 h-4", colors[color].split(" ")[1])} />
      <p className="text-xl md:text-2xl font-pixel">{value}</p>
      <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">{label}</p>
    </div>
  );
};

const formatCount = (value: unknown) => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count.toLocaleString() : "0";
};

// ─── Profile ───────────────────────────────────────────────────────────────────

const Profile = () => {
  const { userId } = useParams();
  const isOwnProfile = !userId;

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [otherUser, setOtherUser] = useState<IUserFrontend | null>(null);
  const [otherUserFollowing, setOtherUserFollowing] = useState(false);
  const [followUpdating, setFollowUpdating] = useState(false);
  const [streams, setStreams] = useState<IStream[]>([]);
  const [donations, setDonations] = useState<IPay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);
  const displayUser = isOwnProfile ? user : otherUser;

  useEffect(() => {
    const load = async () => {
      try {
        if (isOwnProfile) {
          setStreams(user.streams ?? []);
          setDonations(user.donations ?? []);
        } else {
          const { data } = await api.get(`user/${userId}/stats`, { withCredentials: true });
          setOtherUser(data.user);
          setOtherUserFollowing(data.following)
          console.log(data);
          setStreams(data.user?.streams ?? []);
          setDonations(data.user?.donations ?? []);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try { const url = await uploadFile(file, "banner"); setUser((p) => p ? { ...p, banner: url } : p); }
    finally { setUploadingBanner(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try { const url = await uploadFile(file, "avatar"); setUser((p) => p ? { ...p, avatar: url } : p); }
    finally { setUploadingAvatar(false); }
  };

  const updateOtherUserFollowerCount = (isFollowing: boolean) => {
    setOtherUser((prev) => {
      if (!prev) return prev;

      const followerCount = Number(prev.followerCount ?? 0);
      return {
        ...prev,
        followerCount: Math.max(0, followerCount + (isFollowing ? 1 : -1)),
      };
    });
  };

  const handleFollow = async (id: string) => {
    if (followUpdating) return;

    const nextFollowing = !otherUserFollowing;

    setFollowUpdating(true);
    setOtherUserFollowing(nextFollowing);
    updateOtherUserFollowerCount(nextFollowing);

    try {
      const data = await api.post("/user/follow", { followedId: id });
      console.log(data);
    } catch (err) {
      console.error(err);
      setOtherUserFollowing(!nextFollowing);
      updateOtherUserFollowerCount(!nextFollowing);
    } finally {
      setFollowUpdating(false);
    }
  }

  const handleDeleteStream = async (streamId: string) => {
    if (deletingStreamId) return;

    setDeletingStreamId(streamId);
    try {
      const { data } = await api.delete(`/stream/${streamId}/delete`);
      setStreams((current) =>
        current.filter((stream) => String(stream._id) !== streamId)
      );
      setUser((current) => current ? {
        ...current,
        streams: (current.streams ?? []).filter(
          (stream) => String(stream._id) !== streamId
        ),
      } : current);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete stream");
    } finally {
      setDeletingStreamId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {["0ms", "150ms", "300ms"].map((d, i) => (
            <div key={i} className={cn("w-2 h-2 animate-pulse", ["bg-vhs-purple", "bg-vhs-cyan", "bg-vhs-pink"][i])}
              style={{ animationDelay: d }} />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground animate-pulse uppercase tracking-widest">loading profile...</span>
      </div>
    </div>
  );

  if (error || !displayUser) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <span className="font-mono text-destructive">[ERROR] {error || "User not found"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background crt-container film-grain pl-16">
      {showEditModal && isOwnProfile && user && (
        <EditModal user={user} onClose={() => setShowEditModal(false)}
          onSave={(u) => setUser((p) => p ? { ...p, ...u } : p)} />
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* ── Banner + Avatar ── */}
        <div className="relative w-full h-72 md:h-96 border-2 border-vhs-purple overflow-hidden">
          {/* Banner */}
          {isOwnProfile ? (
            <ImageUploadOverlay onUpload={handleBannerUpload} uploading={uploadingBanner}
              className="absolute inset-0" hint="CHANGE BANNER">
              <img src={displayUser.banner} alt="banner" className="w-full h-full object-contain object-bottom" />
            </ImageUploadOverlay>
          ) : (
            <img src={displayUser.banner} alt="banner" className="w-full h-full object-cover object-bottom" />
          )}

          {/* Dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none z-10" />

          {/* Scanline effect */}
          <div className="absolute inset-0 scanlines pointer-events-none z-10 opacity-30" />

          {/* Edit button */}
          {isOwnProfile && (
            <button onClick={() => setShowEditModal(true)}
              className="absolute top-4 right-4  flex items-center gap-2 px-2 py-1.5 font-pixel text-[13px] tracking-widest text-vhs-cyan bg-purple-400 border-x-2 border-vhs-cyan hover:bg-purple-500 active:translate-y-[2px] transition-all duration-150">
              <Pencil className="w-3 h-3" /> EDIT
            </button>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-5 flex items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {isOwnProfile ? (
                <ImageUploadOverlay
                  onUpload={handleAvatarUpload}
                  uploading={uploadingAvatar}
                  className="w-28 h-28 md:w-36 md:h-36 border-x-4 border-y-2 border-vhs-purple overflow-hidden relative"
                  hint="CHANGE PFP"
                >
                  {displayUser.avatar ? (
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-vhs-purple/20 flex items-center justify-center">
                      <span className="font-pixel text-4xl text-white/80">
                        {displayUser.username.charAt(0)}
                      </span>
                    </div>
                  )}
                </ImageUploadOverlay>
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 overflow-hidden relative">
                  {displayUser.avatar && (
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.username}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 pb-1">
              <div className="flex gap-3">
                <GlitchText text={displayUser.username} as="h1" className="text-2xl md:text-4xl font-pixel text-white" />
                {!isOwnProfile && (
                  <button
                    onClick={() => handleFollow(String(displayUser._id))}
                    disabled={followUpdating}
                    className={`bottom-15 left-45 z-30 flex items-center px-3 font-pixel text-[10px] border bg-black/70 transition-colors
    ${otherUserFollowing
                        ? "text-green-400 border-green-400/60 hover:bg-green-400/10"
                        : "text-vhs-cyan border-purple-50 hover:bg-purple-600"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {otherUserFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs md:text-sm font-mono text-white/70 max-w-xl line-clamp-2">{displayUser.bio}</p>
              <div className="flex items-center gap-5 mt-2 flex-wrap">
                {displayUser.websiteId && (
                  <a
                    href={
                      displayUser.websiteId.startsWith("http")
                        ? displayUser.websiteId
                        : `https://${displayUser.websiteId}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-vhs-cyan hover:text-vhs-pink transition-colors text-xs font-mono"
                  >
                    <Globe className="w-3 h-3" />
                    {displayUser.websiteId}
                  </a>
                )}
                <span className="flex items-center gap-1 text-muted-foreground text-xs font-mono">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(displayUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>

                {isOwnProfile ? (
                  displayUser.isVerified && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )) : displayUser.isVerified && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Followers" value={formatCount(displayUser.followerCount)} color="vhs-purple" />
          <StatCard icon={Heart} label="Following" value={formatCount(displayUser.followCount)} color="vhs-pink" />
          <StatCard icon={Video} label="Streams" value={formatCount(streams.length)} color="vhs-cyan" />
          <StatCard icon={Signal} label="Donations" value={formatCount(donations.length)} color="terminal-green" />
        </div>

        {/* ── Tabs ── */}
        <div className="border-2 border-vhs-purple/50 bg-black/30">
          <Tabs defaultValue="streams" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-black/60 border-b-2 border-vhs-purple/30 rounded-none h-auto p-0">
              <TabsTrigger value="streams"
                className="font-pixel text-xs py-3 rounded-none data-[state=active]:bg-vhs-purple/20 data-[state=active]:text-vhs-pink data-[state=active]:border-b-2 data-[state=active]:border-vhs-pink text-muted-foreground transition-all">
                <Video className="w-3 h-3 mr-2" /> STREAMS
              </TabsTrigger>
              <TabsTrigger value="donations"
                className="font-pixel text-xs py-3 rounded-none data-[state=active]:bg-vhs-purple/20 data-[state=active]:text-vhs-cyan data-[state=active]:border-b-2 data-[state=active]:border-vhs-cyan text-muted-foreground transition-all">
                <DollarSign className="w-3 h-3 mr-2" /> DONATIONS
              </TabsTrigger>
            </TabsList>

            {/* Streams */}
            <TabsContent value="streams" className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-vhs-pink" />
                <h3 className="font-pixel text-vhs-pink text-xs uppercase tracking-widest">Recent Streams</h3>
              </div>
              {streams.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground opacity-50 text-center py-8 uppercase tracking-widest">
                  {'>'} no streams yet
                </p>
              ) : streams.map((stream) => {
                const duration = stream.startedAt && stream.endedAt
                  ? Math.floor((new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 60000) + "min"
                  : stream.status === "live" ? "LIVE" : "—";
                return (
                  <div key={String(stream._id)}
                    className="flex items-center gap-4 p-3 border border-vhs-purple/20 bg-black/20 hover:bg-vhs-purple/5 hover:border-vhs-purple/40 transition-all group">
                    <div className="w-14 h-10 border border-vhs-purple/30 overflow-hidden shrink-0">
                      <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm text-foreground truncate">{stream.title}</span>
                        {stream.status === "live" && (
                          <span className="font-pixel text-[9px] text-destructive border border-destructive/50 px-1.5 py-0.5 animate-pulse">LIVE</span>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          <span className="font-mono text-xs">{formatCount(stream.viewers)}</span>
                        </div>
                      </div>
                      {stream.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {stream.tags.map((t) => (
                            <span key={t} className="font-mono text-[10px] text-vhs-purple/70">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{duration}</span>
                    {isOwnProfile && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            disabled={deletingStreamId !== null}
                            className="shrink-0 border border-destructive/50 p-2 text-destructive transition-colors hover:bg-destructive/15 hover:border-destructive disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${stream.title}`}
                            title="Delete stream"
                          >
                            {deletingStreamId === String(stream._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-2 border-destructive bg-background font-mono shadow-[0_0_40px_rgba(239,68,68,0.25)]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-pixel text-sm uppercase text-destructive">
                              Delete stream?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-mono">
                              Are you sure you want to permanently delete “{stream.title}”? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-pixel text-xs">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStream(String(stream._id))}
                              className="bg-destructive font-pixel text-xs text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            {/* Donations */}
            <TabsContent value="donations" className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-vhs-cyan" />
                <h3 className="font-pixel text-vhs-cyan text-xs uppercase tracking-widest">Recent Donations</h3>
              </div>
              {donations.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground opacity-50 text-center py-8 uppercase tracking-widest">
                  {'>'} no donations yet
                </p>
              ) : donations.map((d) => (
                <div key={String(d.userId)}
                  className="flex items-center gap-4 p-3 border border-vhs-cyan/20 bg-black/20 hover:bg-vhs-cyan/5 hover:border-vhs-cyan/40 transition-all">
                  <div className="w-10 h-10 border border-vhs-cyan/30 flex items-center justify-center shrink-0 bg-vhs-purple/10">
                    {d.userPfp
                      ? <img src={d.userPfp} alt={d.username} className="w-full h-full object-cover" />
                      : <span className="font-pixel text-vhs-cyan text-sm">{d.username?.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-foreground">{d.username}</span>
                      <span className="font-pixel text-vhs-cyan text-sm">{d.currency}{d.amount}</span>
                    </div>
                    {d.message && (
                      <p className="font-mono text-xs text-muted-foreground mt-0.5 truncate">"{d.message}"</p>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
