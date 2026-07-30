import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Bell, BellOff, X, BellRingIcon } from "lucide-react";
import { INotification } from "@istream/shared";
import { api } from "@/App";
import { getSocket } from "@/lib/socket";

const TYPE_META: Record<string, { symbol: string; label: string }> = {
  follow: { symbol: "👤", label: "followed you" },
  stream: { symbol: "🎥", label: "went live" },
  chat: { symbol: "💬", label: "sent you a message" },
  like: { symbol: "❤️", label: "liked your stream" },
};

type NotificationItem = INotification & { _id: string };

const NotifDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // unread count is persisted across opens so the badge doesn't vanish after marking read
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasConnected = useRef(false);
  const notifySocket = getSocket("/notify");

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<NotificationItem[]>("/user/notify");
      setNotifs(data);
      setUnreadCount(data.length);
    } catch (err: any) {
      setError(err.response?.data?.message?.toUpperCase() || "FAILED TO LOAD");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    if (!notifySocket) return;

    const handleConnect = () => {
      if (hasConnected.current) {
        // Reconcile notifications that may have arrived while the socket was offline.
        fetchNotifs();
      }
      hasConnected.current = true;
    };
    const handleNotification = (payload: string | NotificationItem) => {
      try {
        const notification = typeof payload === "string" ? JSON.parse(payload) : payload;
        if (!notification?._id) return;
        setNotifs((current) => {
          if (current.some((item) => String(item._id) === String(notification._id))) {
            return current;
          }
          setUnreadCount((count) => count + 1);
          return [...current, notification];
        });
      } catch {
        console.error("Received an invalid notification payload");
      }
    };

    notifySocket.on("connect", handleConnect);
    notifySocket.on("notifications", handleNotification);
    if (notifySocket.connected) hasConnected.current = true;

    return () => {
      notifySocket.off("connect", handleConnect);
      notifySocket.off("notifications", handleNotification);
    };
  }, [fetchNotifs, notifySocket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!open) {
      const latestNotification = notifs[notifs.length - 1];
      if (latestNotification) {
        api
          .patch("/user/update/lastReadNotif", { notifId: latestNotification._id })
          .then(() => setUnreadCount(0))
          .catch((err) => {
            setError(err.response?.data?.message?.toUpperCase() || "FAILED TO MARK AS READ");
          });
      }
    }
    setOpen((prev) => !prev);
  };

  return (
    <div ref={ref} className="relative z-50">
      {/* Bell trigger */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-9 border-2 border-muted text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200 group"
      >
        <BellRingIcon className="w-4 h-4 border-primary  text-primary-foreground group-hover:text-vhs-cyan transition-colors" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-pink-700 border border-background flex items-center justify-center font-pixel text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 border-2 border-vhs-purple/60 bg-card/95 backdrop-blur-md shadow-vhs overflow-hidden">

          {/* Header */}
          <div className="flex items-center z-50 justify-between px-4 py-2.5 border-2 border-v text-muted-foreground hover:border-primary hover:text-primary">
            <div className="flex items-center gap-2">
              <Bell className="w-3 h-3 text-vhs-cyan" />
              <span className="font-pixel text-[10px] text-vhs-cyan tracking-widest">
                NOTIFICATIONS
              </span>
              {notifs.length > 0 && (
                <span className="font-pixel text-[8px] text-vhs-pink">
                  [{notifs.length} NEW]
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="w-3 h-3 text-muted-foreground hover:text-vhs-pink transition-colors" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-vhs-purple/30">
            {loading && (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="w-4 h-4 text-vhs-cyan animate-spin" />
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
                  FETCHING...
                </span>
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center justify-center py-10">
                <span className="font-pixel text-[10px] text-vhs-pink">[ERR] {error}</span>
              </div>
            )}

            {!loading && !error && notifs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <BellOff className="w-6 h-6 text-muted-foreground/30" />
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
                  ALL CAUGHT UP
                </span>
              </div>
            )}
            {!loading &&
              !error &&
              Array.isArray(notifs) &&
              notifs.map((notif) => (
                <NotifItem key={notif._id} notif={notif} />
              ))}

          </div>
        </div>
      )}
    </div>
  );
};


const NotifItem = ({ notif }: { notif: NotificationItem }) => {
  const meta = TYPE_META[notif.type];

  const timeAgo = (() => {
    const diff = Date.now() - Number(notif.createdAt);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-vhs-purple/10 border-l-2 border-l-vhs-cyan bg-vhs-cyan/[0.03] hover:bg-vhs-purple/5 transition-colors">
      <span className="text-base mt-0.5 shrink-0">{meta.symbol}</span>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs leading-relaxed text-foreground">
          <span className="text-vhs-cyan">{notif.actorId ?? "Someone"}</span>
          {" "}{meta.label}
        </p>
        <span className="font-mono text-[9px] text-muted-foreground/60 mt-0.5 block">
          {timeAgo}
        </span>
      </div>

      <div className="w-1.5 h-1.5 rounded-full bg-vhs-cyan mt-1.5 shrink-0 shadow-[0_0_4px_rgba(0,245,255,0.8)]" />
    </div>
  );
};

export default NotifDropdown;
