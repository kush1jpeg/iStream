import { LiveStreamButton } from "./ui/streamButton";
import { MessageButton } from "./ui/MessageButton";
import { useNavigate } from "react-router-dom";
import { FollowedUser, IUser } from "@/types/types";
import { useEffect, useState } from "react";
import { api } from "@/App";

interface SidebarProps {
  followedUsers: FollowedUser[];
}



export const Sidebar: React.FC<SidebarProps> = ({ followedUsers }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<IUser>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const url = `/api/user/me`;          // own profile
        const { data } = await api.get(url, { withCredentials: true });
        setUser(data.data.user);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);



  return (
    <div className="z-50 w-15 bg-zinc-900 text-foreground fixed h-screen flex flex-col items-center gap-3 p-2 py-4 border-purple-500 border-r-2 left-0 top-0  ">


      {/* Followed users */}
      <div className="flex-1 flex flex-col gap-3 ">
        {followedUsers.map((user) => (
          <div key={user._id} className="relative group">
            <a href={user.StreamURL ?? `/profile/${user._id}`}>
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={`
    w-12 h-12 rounded-full object-cover border-2 
    ${user.StreamURL ? "border-gray-800 opacity-100 brightness-125" : "border-gray-700 opacity-40"}
    hover:scale-105 transition-transform duration-150
  `}
              />
              {user.StreamURL && (
                <div className="absolute z-20 -top-0 -right-1 text-red-500 text-[10px] font-bold rounded uppercase shadow-neon bg-zinc-900">
                  LIVE
                </div>
              )}

              {/* Frame — sits around the avatar */}
              {user.frame && (
                <img
                  src={user.frame}
                  alt="frame"
                  className="absolute opacity-90 inset-0 w-full h-full object-contain scale-125 z-10 pointer-events-none "
                />
              )}

            </a>
          </div>
        ))}
      </div>


      < LiveStreamButton />

      <MessageButton />

      {/* Divider */}
      <div className="border-t border-border w-full mb-2" />
      {/* Frame — sits around the avatar */}
      {user?.currentFrame && (
        <img
          src={user.currentFrame}
          alt="frame"
          className="absolute opacity-90 inset-0 w-full h-full object-contain scale-125 z-10 pointer-events-none"
        />
      )}      <button
        onClick={() => navigate(`/profile/me`)}
        className="group focus:outline-none"
      >
        <img
          src="https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg"
          alt="live stream"
          className=
          "w-12 h-12 rounded-full object-cover brightness-125 opacity-100 border-2 hover:scale-105 transition-transform duration-150"
        />
      </button>




    </div>
  );
};


