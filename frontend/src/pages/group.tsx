import { useEffect, useRef, useState } from "react";
import { api } from "@/App";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, Check } from "lucide-react";

interface User {
  _id: string;
  username: string;
  avatar: string;
  followerCount?: number;
  isLive?: boolean;
}

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("/group/a.jpg");
  const [uploaded, setUploaded] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  const defaultAvatars = [
    "/group/a.jpg",
    "/group/b.jpg",
    "/group/c.jpg",
    "/group/d.jpg",
    "/group/e.jpg",
    "/group/f.jpg",
  ];

  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) return;

    const fetchUsers = async () => {
      try {
        const { data } = await api.get(`/user/search?user=${search}`);
        setResults(data || []);
        console.log("Search results:", data);
      } catch (err) {
        console.error(err);
      }
    };

    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search]);

  // add member
  const addMember = (user: User) => {
    setResults([]);
    setMembers((prev) => {
      if (prev.find((m) => m._id === user._id)) return prev;
      return [...prev, user];
    });
  };

  // remove member
  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m._id !== id));
  };

  // create group -- currently i am storing the url but do the same like in user
  const createGroup = async () => {
    if (!groupName || members.length === 0) return;

    setLoading(true);
    try {
      const { data } = await api.post(
        "/chat/create/group",
        {
          groupName,
          avatar: selectedAvatar,
          members: members.map((m) => m._id),
        },
        { withCredentials: true }
      );
      console.log("Group created - ", data)
      navigate(`/chat/`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadGroupAvatar = async (file: File): Promise<string> => {
    const { data } = await api.get(
      `/user/get/signed-link?type=group`,
      { withCredentials: true }
    );
    console.log("Received signed link data:", data);

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
      const errText = await uploadRes.text();
      throw new Error(errText || "Cloudinary upload failed");
    }

    const uploadData = await uploadRes.json();
    if (!uploadData?.secure_url) {
      throw new Error("Invalid Cloudinary response");
    }
    setUploaded(true);
    setUploadedAvatarUrl(uploadData.secure_url);
    setSelectedAvatar(uploadData.secure_url);
    return uploadData.secure_url;
  };

  return (
    <div className="min-h-screen bg-black text-purple-300 font-mono p-6 relative overflow-hidden">

      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(128,0,255,0.15),_transparent_70%)]" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#6b21a8_1px,transparent_1px),linear-gradient(to_bottom,#6b21a8_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative max-w-5xl mx-auto">

        <div className="py-3 rounded-3xl border border-purple-700 bg-gradient-to-r from-black via-purple-950 to-black p-2 text-center shadow-[0_0_30px_rgba(128,0,255,0.25)]">
          <p className="text-xs uppercase tracking-[0.55em] text-purple-500 mb-2">Create Group</p>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="GROUP NAME..."
            className="text-3xl pl-4 font-black uppercase tracking-[0.2em] text-purple-700 drop-shadow-[0_0_12px_rgba(168,85,247,0.65)]"
          />
        </div>



        {/* AVATAR UPLOAD */}
        <div className="mt-10 rounded-3xl border border-purple-700 bg-black/80 p-6">
          {uploadedAvatarUrl === null ? (
            <div
              role="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-full rounded-3xl bg-purple-950/20 border border-purple-700 hover:border-purple-400 transition p-6 flex flex-col items-center gap-4 text-center cursor-pointer"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500 bg-purple-950/40 text-purple-300">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Upload group avatar</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.5em] text-purple-600">
                {uploadingAvatar ? "Uploading..." : "Click to upload"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingAvatar(true);
                  try {
                    const url = await uploadGroupAvatar(file);
                    setSelectedAvatar(url);
                    setUploaded(true);
                    setUploadedAvatarUrl(url);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setUploadingAvatar(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
              />
            </div>
          ) : (
            <div
              className="relative w-full rounded-3xl bg-cover bg-center bg-no-repeat p-6 text-center cursor-default overflow-hidden"
              style={{ backgroundImage: `url(${uploadedAvatarUrl})` }}
            >
              <div className="absolute inset-0 bg-black/80" />
              <div className="relative flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-500 bg-green-950/40 text-green-400">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg uppercase tracking-[0.35em] text-green-200">Avatar uploaded</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-purple-700 bg-purple-950/20 p-4">
              <span className="text-xs uppercase tracking-[0.35em] text-purple-400">
                {uploaded && uploadedAvatarUrl ? "Uploaded avatar" : "Current selection"}
              </span>
              <div className="w-20 h-20 rounded-full overflow-hidden border border-purple-400">
                <img
                  src={uploaded && uploadedAvatarUrl ? uploadedAvatarUrl : selectedAvatar}
                  alt="selected avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {uploadedAvatarUrl === null && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {defaultAvatars.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(a);
                      setUploaded(false);
                      setUploadedAvatarUrl(null);
                    }}
                    className={`relative aspect-square w-full overflow-hidden rounded-2xl border p-1 transition ${selectedAvatar === a && !uploaded
                      ? "border-purple-400 bg-purple-900/30"
                      : "border-purple-900 bg-purple-950/40"
                      }`}
                  >
                    <img src={a} alt="default avatar" className="w-full h-full object-cover" />
                    {selectedAvatar === a && !uploaded && (
                      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-purple-400/60" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SEARCH USERS */}
        <div className="mt-6 relative">
          <div className="flex items-center border border-purple-800 p-2">
            <Search className="w-4 h-4 text-purple-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH USERS..."
              className="bg-transparent w-full ml-2 outline-none text-purple-200"
            />
          </div>

          {/* RESULTS */}
          {results.length > 0 && (
            <div className="absolute w-full bg-black border border-purple-800 mt-1 max-h-40 overflow-y-auto z-50">
              {results.map((u) => (
                <div
                  key={u._id}
                  className="flex justify-between items-center p-2 hover:bg-purple-900/30 cursor-pointer gap-3"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={u.avatar}
                      className="w-6 h-6 rounded-full border border-purple-600"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-sm">{u.username}</span>
                      <span className="text-xs text-purple-500">
                        {u.followerCount || 0} followers
                      </span>
                    </div>
                    {u.isLive && (
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        LIVE
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addMember(u)}
                    className="text-xs border border-purple-600 px-2 py-1 hover:bg-purple-700 whitespace-nowrap"
                  >
                    ADD
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MEMBERS PANEL */}
        <div className="mt-10">
          <p className="text-xs text-purple-500 mb-4 uppercase tracking-[0.35em]">
            MEMBERS ({members.length})
          </p>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {members.map((m) => (
              <div
                key={m._id}
                className="relative group rounded-lg overflow-hidden border border-purple-700 bg-purple-950/40 hover:border-purple-400 transition"
              >
                <img
                  src={m.avatar}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-center text-purple-200 px-1">{m.username}</span>
                  <button
                    onClick={() => removeMember(m._id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded p-1 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CREATE BUTTON */}
        <button
          onClick={createGroup}
          disabled={!groupName || members.length === 0 || loading}
          className="mt-8 w-full border border-purple-500 py-3 hover:bg-purple-800 transition disabled:opacity-30"
        >
          {loading ? "CREATING..." : "INITIALIZE GROUP"}
        </button>
      </div>
    </div>
  );
}
