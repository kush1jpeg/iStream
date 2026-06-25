import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { api } from "@/App";
import { useNavigate } from "react-router-dom";

interface SearchUser {
  _id: string;
  username: string;
  avatar?: string;
  followerCount: number;
  isLive: boolean;
  streamId: string | null;
  followed: boolean;
}

const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n));

export const SearchOverlay = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleFollow = async (id: string) => {
    try {
      const res = await api.post("user/follow", {
        followedId: id,
      });
      console.log(res);

      setResults(prev =>
        prev.map(user =>
          user._id === id
            ? {
              ...user,
              followed: !user.followed,
              followerCount: user.followed
                ? user.followerCount - 1
                : user.followerCount + 1,
            }
            : user
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openProfile = (id: string) => {
    navigate(`/profile/${id}`);
    onClose();
  };

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.get<SearchUser[]>(`user/search`, {
        params: { user: q },
      });
      console.log(data);
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setFocused(i => Math.min(i + 1, results.length - 1));
    else if (e.key === "ArrowUp") setFocused(i => Math.max(i - 1, 0));
    else if (e.key === "Enter" && focused >= 0 && results[focused]) {
      openProfile(results[focused]._id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: "rgba(10,0,20,0.92)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* CRT scanlines */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(160,80,255,0.04) 3px,rgba(160,80,255,0.04) 4px)"
      }} />

      <div className="w-[560px] relative" style={{
        background: "rgba(18,4,28,0.98)",
        border: "1px solid rgba(180,80,255,0.3)",
        boxShadow: "0 0 40px rgba(140,50,255,0.12), inset 0 0 30px rgba(100,0,180,0.05)"
      }}>
        {/* top glow bar */}
        <div className="h-[2px] w-full" style={{
          background: "linear-gradient(90deg,transparent,#a040ff,#cc80ff,#a040ff,transparent)"
        }} />

        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 relative" style={{ borderBottom: "1px solid rgba(160,60,255,0.12)" }}>
          <Search size={18} style={{ color: "#b060ff", opacity: 0.8, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setFocused(-1); }}
            onKeyDown={handleKey}
            placeholder="ENTER USERNAME..."
            className="flex-1 bg-transparent border-none outline-none tracking-widest"
            style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: "#e0aaff", caretColor: "#cc80ff" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: "rgba(180,80,255,0.4)", border: "1px solid rgba(160,60,255,0.25)", padding: "1px 8px" }}>
              CLR
            </button>
          )}
          <button onClick={onClose}
            style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: "rgba(180,80,255,0.4)", border: "1px solid rgba(160,60,255,0.25)", padding: "1px 8px" }}>
            ESC
          </button>
        </div>

        {/* results */}
        <div style={{ minHeight: 220 }}>
          {loading && [1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 opacity-40">
              <div className="w-10 h-10 animate-pulse" style={{ background: "rgba(140,40,220,0.15)", flexShrink: 0 }} />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-2.5 animate-pulse" style={{ width: 120 + Math.random() * 80, background: "rgba(140,40,220,0.12)" }} />
                <div className="h-2 animate-pulse" style={{ width: 70, background: "rgba(140,40,220,0.1)" }} />
              </div>
            </div>
          ))}

          {!loading && query.length < 2 && (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(160,60,255,0.2)" }}>AWAITING INPUT</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: "rgba(160,60,255,0.15)", letterSpacing: "0.1em" }}>TYPE TO SCAN</span>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(160,60,255,0.2)" }}>NO SIGNAL FOUND</span>
            </div>
          )}

          {!loading && results.map((user, i) => (
            <div key={user._id}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
              style={{
                borderLeft: i === focused ? "2px solid #b060ff" : "2px solid transparent",
                background: i === focused ? "rgba(140,40,220,0.1)" : "transparent",
                borderBottom: "1px solid rgba(140,40,220,0.08)"
              }}
            >
              <button
                type="button"
                onClick={() => openProfile(user._id)}
                className="w-10 h-10 flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(100,20,160,0.4)", border: "1px solid rgba(160,60,255,0.3)", clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%)", flexShrink: 0, fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: "#cc80ff" }}>
                {user.avatar ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" /> : user.username.slice(0, 2).toUpperCase()}
              </button>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => openProfile(user._id)}
                  className="block max-w-full truncate text-left hover:underline"
                  style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: "#d090ff", letterSpacing: "0.05em", lineHeight: 1.1 }}
                >
                  {user.username}
                </button>
                <p style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "rgba(160,80,255,0.45)", letterSpacing: "0.12em", marginTop: 2 }}>{fmt(user.followerCount)} FOLLOWERS</p>
              </div>
              {user.isLive ? (

                <a href={`/stream/${user.streamId}`}
                  className="animate-pulse flex items-center gap-1"
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#ff60c0",
                    border: "1px solid rgba(255,60,180,0.5)",
                    padding: "3px 8px",
                    letterSpacing: "0.15em",
                    flexShrink: 0,
                    textDecoration: "none",
                  }}
                >
                  ◉ LIVE
                </a>
              ) : <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow(user._id);
                }}
                className={`font-pixel text-[9px] tracking-widest px-2 py-1 border transition-colors ${user.followed
                  ? "border-green-500/50 text-green-400 hover:bg-green-700"
                  : "border-vhs-purple/50 text-vhs-purple hover:bg-indigo-700"
                  }`}
                style={{ flexShrink: 0 }}
              >
                {user.followed ? "FOLLOWING" : "+ FOLLOW"}
              </button>
              }
            </div>
          ))}
        </div>

        <div className="px-4 py-2 flex gap-4 items-center" style={{ borderTop: "1px solid rgba(140,40,220,0.1)" }}>
          {[["↑↓", "NAVIGATE"], ["↵", "OPEN"], ["ESC", "CLOSE"]].map(([k, l]) => (
            <span key={k} className="flex items-center gap-1" style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "rgba(160,60,255,0.25)", letterSpacing: "0.08em" }}>
              <span style={{ border: "1px solid rgba(160,60,255,0.2)", padding: "1px 5px", fontSize: 9 }}>{k}</span> {l}
            </span>
          ))}
          <span className="ml-auto" style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "rgba(160,60,255,0.18)", letterSpacing: "0.2em" }}>VHS-7 SEARCH MODULE</span>
        </div>
      </div>
    </div>
  );
};
