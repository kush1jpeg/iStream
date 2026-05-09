import { useEffect, useRef, useState } from "react";
import { RetroContainer } from "@/components/RetroContainer";
import { GlitchText } from "@/components/GlitchText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Heart,
  Video,
  DollarSign,
  Camera,
  Calendar,
  Eye,
  Globe,
  Pencil,
  X,
  Check,
  Upload,
  Loader2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { IPay, IStream, IUser } from "@/types/types";

// ─── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  user: IUser;
  onClose: () => void;
  onSave: (updated: Partial<IUser>) => void;
}

const EditModal = ({ user, onClose, onSave }: EditModalProps) => {
  const [form, setForm] = useState({
    username: user.username ?? "",
    bio: user.bio ?? "",
    websiteId: user.websiteId ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await axios.patch("/api/user/me", form, { withCredentials: true });
      onSave(form);
      onClose();
    } catch {
      // surface error if you want — for now just close
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 border-2 border-vhs-purple bg-background shadow-vhs rounded-sm font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-vhs-purple/40 bg-vhs-purple/10">
          <span className="font-pixel text-vhs-cyan text-sm tracking-widest">EDIT PROFILE</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-vhs-pink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-5">
          <Field label="USERNAME" name="username" value={form.username} onChange={handleChange} />
          <Field label="WEBSITE" name="websiteId" value={form.websiteId} onChange={handleChange} />
          <div className="space-y-1">
            <label className="text-[10px] text-vhs-cyan tracking-widest uppercase">BIO</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full bg-black/60 border border-vhs-purple/50 text-foreground text-sm px-3 py-2 focus:outline-none focus:border-vhs-cyan resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-vhs-purple/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-pixel border border-vhs-pink/50 text-vhs-pink hover:bg-vhs-pink/10 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-xs font-pixel border border-vhs-cyan/50 text-vhs-cyan hover:bg-vhs-cyan/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {saving ? "SAVING..." : "SAVE"}
          </button> </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-1">
    <label className="text-[10px] text-vhs-cyan tracking-widest uppercase">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-black/60 border border-vhs-purple/50 text-foreground text-sm px-3 py-2 focus:outline-none focus:border-vhs-cyan transition-colors"
    />
  </div>
);

// Flow: GET signed URL  →  PUT directly to Cloudinary  →  PATCH confirm URL in DB

type UploadType = "avatar" | "banner";

const uploadFile = async (file: File, type: UploadType): Promise<string> => {
  // Step 1 — get signed URL + upload params from your backend
  const { data: signedData } = await axios.get(
    `/api/user/get/signed-link?type=${type}`,
    { withCredentials: true }
  );
  const { uploadUrl, ...fields } = signedData.data;

  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string));
  formData.append("file", file);

  const cloudinaryRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!cloudinaryRes.ok) throw new Error("Cloudinary upload failed");

  const cloudinaryData = await cloudinaryRes.json();
  const publicId: string = cloudinaryData.public_id;
  const secure_url: string = cloudinaryData.secure_url;

  const confirmEndpoint =
    type === "avatar" ? "/api/user/upload/avatar" : "/api/user/upload/banner";

  await axios.post(confirmEndpoint, { publicId }, { withCredentials: true });

  return secure_url;
};

// ─── ImageUploadOverlay ────────────────────────────────────────────────────────

interface ImageUploadOverlayProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

const ImageUploadOverlay = ({
  onUpload,
  uploading,
  children,
  className = "",
  hint = "UPLOAD",
}: ImageUploadOverlayProps) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onUpload(file);
    // reset so same file can be re-uploaded
    if (ref.current) ref.current.value = "";
  };

  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      onClick={() => !uploading && ref.current?.click()}
    >
      {children}

      {/* Hover overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center bg-black/60 transition-opacity z-30 pointer-events-none">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-vhs-cyan animate-spin" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-vhs-cyan mb-1" />
            <span className="font-pixel text-vhs-cyan text-[9px] tracking-widest">{hint}</span>
          </>
        )}
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

// ─── Profile ───────────────────────────────────────────────────────────────────

const Profile = () => {
  const { userId } = useParams();
  const isOwnProfile = !userId;

  const [user, setUser] = useState<IUser | null>(null);
  const [streams, setStreams] = useState<IStream[]>([]);
  const [donations, setDonations] = useState<IPay[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const url = userId ? `/api/user/${userId}/stats` : `/api/user/me`;
        const { data } = await axios.get(url, { withCredentials: true });
        setUser(data.data.user);
        setStreams(data.data.streams);
        setDonations(data.data.donations);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const url = await uploadFile(file, "banner");
      setUser((prev) => prev ? { ...prev, banner: url } : prev);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const url = await uploadFile(file, "avatar");
      setUser((prev) => prev ? { ...prev, avatar: url } : prev);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = (updated: Partial<IUser>) => {
    setUser((prev) => prev ? { ...prev, ...updated } : prev);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
        <span className="font-mono text-vhs-purple animate-pulse">loading profile...</span>
      </div>
    );

  if (error || !user)
    return (
      <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
        <span className="font-mono text-destructive">[ERROR] {error || "User not found"}</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-background crt-container film-grain relative overflow-hidden">
      {/* Edit Modal */}
      {showEditModal && (
        <EditModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSave}
        />
      )}

      <main className="container px-4 py-4 relative z-10">
        {/* Profile Header */}
        <RetroContainer
          variant="terminal"
          className="relative w-full h-80 md:h-96 bg-cover bg-center bg-no-repeat overflow-hidden"
          style={{ backgroundImage: `url(${user.banner})` }}
        >
          {/* Banner upload overlay — own profile only */}
          {isOwnProfile && (
            <ImageUploadOverlay
              onUpload={handleBannerUpload}
              uploading={uploadingBanner}
              className="absolute inset-0 z-20"
              hint="CHANGE BANNER"
            >
              <div /> {/* empty — the banner bg is on the parent */}
            </ImageUploadOverlay>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 z-10 pointer-events-none" />

          {/* Edit button — top-right */}
          {isOwnProfile && (
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 font-pixel text-[10px] tracking-widest text-vhs-cyan border border-vhs-cyan/50 bg-black/60 hover:bg-vhs-cyan/10 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              EDIT PROFILE
            </button>
          )}

          {/* Content at the bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row items-start md:items-end gap-6 z-20">
            {/* Avatar */}
            <div className="relative">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                {/* Frame */}
                {user.currentFrame && (
                  <img
                    src={user.currentFrame}
                    alt="frame"
                    className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                  />
                )}
                {/* Animation */}
                {user.currentAnimation && (
                  <img
                    src={user.currentAnimation}
                    alt="animation"
                    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                  />
                )}

                {/* Avatar with optional upload overlay */}
                {isOwnProfile ? (
                  <ImageUploadOverlay
                    onUpload={handleAvatarUpload}
                    uploading={uploadingAvatar}
                    className="w-full h-full rounded border-4 border-vhs-purple shadow-vhs overflow-hidden"
                    hint="CHANGE PFP"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-vhs-purple/20">
                        <span className="text-6xl md:text-7xl font-pixel text-white/80">
                          {user.username.charAt(0)}
                        </span>
                      </div>
                    )}
                  </ImageUploadOverlay>
                ) : (
                  <div className="w-full h-full rounded border-4 border-vhs-purple shadow-vhs overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-vhs-purple/20">
                        <span className="text-6xl md:text-7xl font-pixel text-white/80">
                          {user.username.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Camera icon badge — just visual cue for own profile */}
              {isOwnProfile && (
                <div className="absolute -bottom-1 -right-1 z-30 w-7 h-7 bg-vhs-purple border border-vhs-cyan flex items-center justify-center pointer-events-none">
                  <Camera className="w-3.5 h-3.5 text-vhs-cyan" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-white">
              <GlitchText text={user.username} as="h1" className="text-3xl md:text-5xl font-pixel" />
              <p className="mt-2 text-sm md:text-base font-mono">{user.bio}</p>

              <div className="flex gap-4 mt-2">
                {user.websiteId && (
                  <a
                    href={user.websiteId}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-vhs-cyan hover:text-vhs-pink transition-colors"
                  >
                    <Globe className="w-4 h-4" /> {user.websiteId}
                  </a>
                )}
              </div>

              <p className="mt-2 text-xs md:text-sm flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" /> Joined {user.createdAt}
              </p>
            </div>
          </div>
        </RetroContainer>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 m-6 gap-4">
          <StatCard icon={Users} label="Followers" value={user.followerCount.toLocaleString()} color="vhs-purple" />
          <StatCard icon={Heart} label="Following" value={user.followCount.toLocaleString()} color="vhs-pink" />
        </div>

        {/* Content Tabs */}
        <RetroContainer
          variant="terminal"
          className="bg-card/90 backdrop-blur-md border-2 border-vhs-purple/50 shadow-vhs"
        >
          <Tabs defaultValue="streams" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 border border-vhs-purple/30">
              <TabsTrigger
                value="streams"
                className="font-pixel text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vhs-purple data-[state=active]:to-vhs-pink data-[state=active]:text-white text-muted-foreground"
              >
                <Video className="w-4 h-4 mr-2" />
                STREAMS
              </TabsTrigger>
              <TabsTrigger
                value="donations"
                className="font-pixel text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vhs-purple data-[state=active]:to-vhs-pink data-[state=active]:text-white text-muted-foreground"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                DONATIONS
              </TabsTrigger>
            </TabsList>

            {/* Streams Tab */}
            <TabsContent value="streams" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-vhs-pink text-sm">RECENT STREAMS</h3>
              </div>
              <div className="space-y-3">
                {streams.map((stream) => {
                  const duration =
                    stream.startedAt && stream.endedAt
                      ? Math.floor(
                        (new Date(stream.endedAt).getTime() -
                          new Date(stream.startedAt).getTime()) /
                        1000 /
                        60
                      ) + " min"
                      : "Live";

                  return (
                    <div
                      key={stream._id}
                      className="flex items-center gap-4 p-4 border border-vhs-pink/30 rounded-l bg-black/30 hover:bg-vhs-pink/10 transition-colors"
                    >
                      <div className="w-12 h-12 border border-vhs-pink/50 overflow-hidden">
                        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-5">
                          <span className="font-mono text-vhs-cyan">{stream.title}</span>
                          <div className="flex gap-1 items-center">
                            <Eye className="w-4 h-4" />
                            <span className="font-mono text-vhs-cyan">{stream.viewers}</span>
                          </div>
                        </div>
                        {stream.tags?.length > 0 && (
                          <p className="text-foreground/80 font-mono text-sm mt-1">{stream.tags.join(", ")}</p>
                        )}
                      </div>
                      <span className="text-muted-foreground font-mono text-xs">{duration}</span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Donations Tab */}
            <TabsContent value="donations" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-vhs-pink text-sm">RECENT DONATIONS</h3>
              </div>
              <div className="space-y-3">
                {donations.map((donation) => (
                  <div
                    key={donation._id}
                    className="flex items-center gap-4 p-4 border border-vhs-pink/30 bg-black/30 hover:bg-vhs-pink/10 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-vhs-purple to-vhs-pink flex items-center justify-center border border-vhs-pink/50">
                      <span className="font-pixel text-white text-lg">
                        {donation.userPfp ?? donation.username.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-vhs-cyan">{donation.username}</span>
                        <span className="font-mono text-vhs-cyan">{donation.streamId}</span>
                        <span className="font-pixel text-vhs-pink">
                          {donation.currency}{donation.amount}
                        </span>
                      </div>
                      {donation.message && (
                        <p className="text-foreground/80 font-mono text-sm mt-1">"{donation.message}"</p>
                      )}
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </RetroContainer>
      </main>
    </div>
  );
};

// ─── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    "vhs-purple": "border-vhs-purple/50 text-vhs-purple bg-vhs-purple/10",
    "vhs-pink": "border-vhs-pink/50 text-vhs-pink bg-vhs-pink/10",
    "vhs-cyan": "border-vhs-cyan/50 text-vhs-cyan bg-vhs-cyan/10",
    "terminal-green": "border-terminal-green/50 text-terminal-green bg-terminal-green/10",
  };

  return (
    <RetroContainer className={`bg-card/90 backdrop-blur-md border ${colorClasses[color]} shadow-vhs p-3`}>
      <div className="flex flex-col items-center text-center gap-1">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(" ")[1]}`} />
        <p className="text-lg md:text-xl font-pixel">{value}</p>
        <p className="text-muted-foreground font-mono text-[10px] uppercase">{label}</p>
      </div>
    </RetroContainer>
  );
};

export default Profile;
