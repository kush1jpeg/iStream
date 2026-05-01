const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
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
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { IPay, IStream, IUser } from "@/types/types";



const Profile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<IUser>(null);
  const [streams, setStreams] = useState<IStream[]>([]);
  const [donations, setDonations] = useState<IPay[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const url = userId
          ? `${API}/api/user/${userId}/stats`   // other user's profile
          : `${API}/api/user/me`;          // own profile
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


  if (loading) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <span className="font-mono text-vhs-purple animate-pulse">loading profile...</span>
    </div>
  );

  if (error || !user) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <span className="font-mono text-destructive">[ERROR] {error || "User not found"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background crt-container film-grain relative overflow-hidden">

      <Navigation />


      <main className="container px-4 py-4 relative z-10">
        {/* Profile Header Section */}
        <RetroContainer
          variant="terminal"
          className="relative w-full h-80 md:h-96 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${user.banner})` }}
        >
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />

          {/* Content positioned at the bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row items-start md:items-end gap-6 z-10">
            {/* Avatar */}
            <div className="relative group">
              <div className="relative w-32 h-32 md:w-40 md:h-40">

                {/* Frame — sits around the avatar */}
                {user.currentFrame && (
                  <img
                    src={user.currentFrame}
                    alt="frame"
                    className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                  />
                )}

                {/* Animation — overlays on top of avatar */}
                {user.currentAnimation && (
                  <img
                    src={user.currentAnimation}
                    alt="animation"
                    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                  />
                )}

                {/* Avatar */}
                <div className="w-full h-full rounded border-4 border-vhs-purple shadow-vhs overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl md:text-7xl font-pixel text-white/80">
                      {user.username.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              <button className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center border-4 border-vhs-purple bg-black/50 transition-opacity">
                <Camera className="w-8 h-8 text-vhs-cyan" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-white">
              <GlitchText text={user.username} as="h1" className="text-3xl md:text-5xl font-pixel" />
              <p className="mt-2 text-sm md:text-base font-mono">{user.bio}</p>

              {/* Social Links */}
              <div className="flex gap-4 mt-2">
                {user.websiteId && (
                  <a href="#" className="flex items-center gap-2 text-vhs-cyan hover:text-vhs-pink transition-colors">
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
        <div className="grid grid-cols-2 md:grid-cols-4  m-6 gap-4">
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
                      {/* Thumbnail */}
                      <div className="w-12 h-12 border border-vhs-pink/50 overflow-hidden">
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-5">
                          <span className="font-mono text-vhs-cyan">
                            {stream.title}
                          </span>

                          <div className="flex gap-1 items-center">
                            <Eye className="w-4 h-4" />
                            <span className="font-mono text-vhs-cyan">
                              {stream.viewers}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {stream.tags?.length > 0 && (
                          <p className="text-foreground/80 font-mono text-sm mt-1">
                            {stream.tags.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      <span className="text-muted-foreground font-mono text-xs">
                        {duration}
                      </span>
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
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-vhs-purple to-vhs-pink flex items-center justify-center border border-vhs-pink/50">
                      <span className="font-pixel text-white text-lg">
                        {donation.username?.charAt(0) || "?"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-vhs-cyan">
                          {donation.username || "Anonymous"}
                        </span>
                        <span className="font-pixel text-vhs-pink">
                          ₹{donation.amount}
                        </span>
                      </div>

                      {donation.message && (
                        <p className="text-foreground/80 font-mono text-sm mt-1">
                          "{donation.message}"
                        </p>
                      )}
                    </div>

                    {/* Date */}
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

// Helper Components
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
    <RetroContainer className={` bg-card/90 backdrop-blur-md border ${colorClasses[color]} shadow-vhs p-3`}>
      <div className="flex flex-col items-center text-center gap-1">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[1]}`} />
        <p className="text-lg md:text-xl font-pixel">{value}</p>
        <p className="text-muted-foreground font-mono text-[10px] uppercase">{label}</p>
      </div>
    </RetroContainer>
  );
};

export default Profile;

