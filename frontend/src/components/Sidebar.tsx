import { LiveStreamButton } from "./ui/streamButton";
import { MessageButton } from "./ui/MessageButton";
import { useNavigate } from "react-router-dom";


interface FollowedUser {
  id: string;
  name: string;
  avatarUrl: string;
  isStreaming: boolean;
}

interface SidebarProps {
  followedUsers: FollowedUser[];
}


export const Sidebar: React.FC<SidebarProps> = ({ followedUsers }) => {
  const navigate = useNavigate();

  return (
    <div className="z-50 w-15 bg-zinc-900 text-foreground fixed h-screen flex flex-col items-center gap-3 p-2 py-4 border-purple-500 border-r-2 left-0 top-0  ">


      {/* Followed users */}
      <div className="flex-1 flex flex-col gap-3 ">
        {followedUsers.map((user) => (
          <div key={user.id} className="relative group">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className={`
    w-12 h-12 rounded-full object-cover border-2 
    ${user.isStreaming ? "border-gray-800 opacity-100 brightness-125" : "border-gray-700 opacity-40"}
    hover:scale-105 transition-transform duration-150
  `}
            />
            {user.isStreaming && (
              <div className="absolute -top-0 -right-2 px-1.5 py-0.5 bg-vhs-purple text-red-500 text-[10px] font-bold rounded uppercase shadow-neon">
                LIVE
              </div>
            )}

          </div>
        ))}
      </div>


      < LiveStreamButton />
      <MessageButton />

      {/* Divider */}
      <div className="border-t border-border w-full mb-2" />
      <button
        onClick={() => navigate(`/profile`)}
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


