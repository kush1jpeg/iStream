import { LiveStreamButton } from "./ui/streamButton";
import { MessageButton } from "./ui/MessageButton";
import { useNavigate } from "react-router-dom";
import LogoutButton from "./logout";
import { useAuthStore } from "./zustand/zustand";
import { SearchButton } from "./ui/SearchCheckButton";
import { getSocket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { api } from "@/App";

type SidebarUser = {
  _id: string;
  username: string;
  avatar: string;
  currentFrame?: string;
  isLive?: boolean;
  streamId?: string;
};

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [followedUsers, setFollowed] = useState<SidebarUser[]>([]);
  const socketsReady = useAuthStore((s) => s.socketsReady);

  useEffect(() => {
    if (!socketsReady) return;
    const sidebarSocket = getSocket("/sidebar");
    const transformData = (data: any) => {
      const liveUsers =
        data.live?.map((u: any) => ({
          _id: u.userId,
          username: u.username,
          avatar: u.avatar,
          frame: u.currentFrame,
          isLive: true,
        })) || [];

      const offlineUsers =
        data.offline?.map((u: any) => ({
          _id: u._id,
          username: u.username,
          avatar: u.avatar,
          frame: u.currentFrame,
          isLive: false,
        })) || [];

      return [...liveUsers, ...offlineUsers];
    };

    const handleInit = (data: any) => {
      console.log("sidebar:init", data);
      setFollowed(transformData(data));
    };

    const handleUpdate = (u: any) => {
      setFollowed((prev) => {
        const exists = prev.some((x) => x._id === u._id);

        if (exists) {
          return prev.map((user) =>
            user._id === u.userId
              ? {
                ...user,
                isLive: true,
              }
              : user
          );
        }

        return [
          {
            _id: u.userId,
            username: u.username,
            avatar: u.avatar,
            frame: u.currentFrame,
            isLive: true,
          },
          ...prev,
        ];
      });
    };

    sidebarSocket.on("connect", () => {
      console.log("/sidebar connected");
    });

    sidebarSocket.on("disconnect", () => {
      console.log("/sidebar disconnected");
    });

    sidebarSocket.on("sidebar:init", handleInit);
    sidebarSocket.on("sidebar:update", handleUpdate);

    return () => {
      sidebarSocket.off("sidebar:init", handleInit);
      sidebarSocket.off("sidebar:update", handleUpdate);
    }
  }, []);

  const redirectLive = async (userId: string) => {
    try {
      const { data } = await api.get("/stream/getId", {
        params: { userId },
      });

      navigate(`/stream/${data.streamId}`);
    } catch (err) {
      console.error("Failed to get stream:", err);
    }
  };

  return (
    <div className="z-50 w-15 bg-zinc-900 text-foreground fixed h-screen flex flex-col items-center gap-3 p-2 py-4 border-purple-500 border-r-2 left-0 top-0  ">


      {/* Followed users */}
      <div className="flex-1 flex flex-col gap-3 ">
        {followedUsers.map((user) => (
          <div key={user._id} className="relative group">
            <button
              onClick={() => {
                if (user.isLive) {
                  redirectLive(user._id);
                } else {
                  navigate(`/profile/${user._id}`);
                }
              }}
              className="relative"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className={`
    w-12 h-12 rounded-full object-cover border-2 
    ${user.isLive ? "border-gray-800 opacity-100 brightness-125" : "border-gray-700 opacity-40"}
    hover:scale-105 transition-transform duration-150
  `}
              />
              {user.isLive && (
                <div className="absolute z-20 -top-0 -right-1 text-red-500 text-[10px] font-bold rounded uppercase shadow-neon bg-zinc-900">
                  LIVE
                </div>
              )}

              {/* Frame — sits around the avatar */}
              {user.currentFrame && (
                <img
                  src={user.currentFrame}
                  alt="frame"
                  className="absolute opacity-90 inset-0 w-full h-full object-contain scale-125 z-10 pointer-events-none "
                />
              )}
            </button>
          </div>
        ))}
      </div>
      < SearchButton />


      {user && (<> < LiveStreamButton />

        <MessageButton />

        {/* Divider */}
        <div className="border-t border-border w-full mb-2" />
        {/* Frame — sits around the avatar */}
        {user && (
          <>
            {/* Frame */}
            {user.currentFrame && (
              <img
                src={user.currentFrame}
                alt="frame"
                className="absolute opacity-90 inset-0 w-full h-full object-contain scale-125 z-10 pointer-events-none"
              />
            )}

            <button
              onClick={() => navigate(`/profile/me`)}
              className="group focus:outline-none"
            >
              <img
                src={user?.avatar}
                alt="profile"
                className="w-12 h-12 rounded-full object-cover brightness-125 opacity-100 border-2 hover:scale-105 transition-transform duration-150"
              />
            </button>
          </>
        )}
        {/* Divider */}
        <div className="border-t border-border w-full mb-2" />

        <LogoutButton />

      </>)}

    </div>
  );
};


