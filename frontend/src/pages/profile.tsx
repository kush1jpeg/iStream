import { useState } from "react";
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
  Instagram,
} from "lucide-react";

// Mock data for the profile
const mockUser = {
  username: "CyberStreamer_X",
  bio: "even if he caught him and brought him back to the colony, he would immediately head right back for the mountains, but why?",
  avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg",
  bannerUrl: "https://i.pinimg.com/1200x/37/6a/ca/376aca292693fcf304f6ba99ed4341fe.jpg",
  joinDate: "March 2020",
  followers: 12847,
  following: 234,
  totalStreams: 847,
  totalHours: 2340,
  totalViews: 1234567,
  socials: {
    instagram: "@cyberstreamer_x",
    youtube: "CyberStreamerX",
  }
};

const mockStreams = [
  { id: "1", thumbnail: "https://i.pinimg.com/1200x/ef/67/e7/ef67e7d708723b3db2bd284b7e392843.jpg", title: "Late Night Retro Gaming Marathon", duration: "35mins", viewers: 1234, tags: ["#game", "#linux"] },
  { id: "4", thumbnail: "https://i.pinimg.com/1200x/ef/67/e7/ef67e7d708723b3db2bd284b7e392843.jpg", title: "Viewer Game Night!", duration: "135mins", viewers: 1567, tags: ["#kernel", "#linux"] },
];

const mockDonations = [
  { id: 1, from: "NeonGamer42", amount: 50, message: "Amazing stream! Keep it up! 🔥", date: "2024-01-15" },
  { id: 2, from: "PixelQueen", amount: 25, message: "Love your content!", date: "2024-01-14" },
];

const followedUsers = [
  { id: "1", name: "Alice", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: true },
  { id: "2", name: "Bob", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: false },
];


const Profile = () => {
  const [user, setUser] = useState(mockUser);

  return (
    <div className="min-h-screen bg-background crt-container film-grain relative overflow-hidden">

      <Navigation />


      <main className="container px-4 py-4 relative z-10">
        {/* Profile Header Section */}
        <RetroContainer
          variant="terminal"
          className="relative w-full h-80 md:h-96 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${user.bannerUrl})` }}
        >
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />

          {/* Content positioned at the bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row items-start md:items-end gap-6 z-10">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded border-4 border-vhs-purple shadow-vhs overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl md:text-7xl font-pixel text-white/80">{user.username.charAt(0)}</span>
                )}
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
                {user.socials.instagram && (
                  <a href="#" className="flex items-center gap-2 text-vhs-cyan hover:text-vhs-pink transition-colors">
                    <Instagram className="w-4 h-4" /> {user.socials.instagram}
                  </a>
                )}
              </div>

              <p className="mt-2 text-xs md:text-sm flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" /> Joined {user.joinDate}
              </p>
            </div>
          </div>
        </RetroContainer>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4  m-6 gap-4">
          <StatCard icon={Users} label="Followers" value={user.followers.toLocaleString()} color="vhs-purple" />
          <StatCard icon={Heart} label="Following" value={user.following.toLocaleString()} color="vhs-pink" />
          <StatCard icon={Video} label="Total Streams" value={user.totalStreams.toLocaleString()} color="vhs-cyan" />
          <StatCard icon={Eye} label="Total Views" value={formatNumber(user.totalViews)} color="terminal-green" />
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
                {mockStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="flex items-center gap-4 p-4 border border-vhs-pink/30 rounded-l bg-black/30 hover:bg-vhs-pink/10 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-vhs-purple to-vhs-pink flex items-center justify-center border border-vhs-pink/50">
                      <span className="font-pixel text-white text-lg">
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                        />
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-5">
                        <span className="font-mono text-vhs-cyan ">{stream.title}</span>
                        <div className="flex gap-1 items-center">
                          <Eye className="w-4 h-4 " />
                          <span className="font-mono text-vhs-cyan">   {stream.viewers}</span>
                        </div>
                      </div>
                      <p className="text-foreground/80 font-mono text-sm mt-1">{stream.tags.join(", ")}</p>
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">{stream.duration}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Donations Tab */}
            <TabsContent value="donations" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-vhs-pink text-sm">RECENT DONATIONS</h3>
              </div>
              <div className="space-y-3">
                {mockDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center gap-4 p-4 border border-vhs-pink/30 bg-black/30 hover:bg-vhs-pink/10 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-vhs-purple to-vhs-pink flex items-center justify-center border border-vhs-pink/50">
                      <span className="font-pixel text-white text-lg">{donation.from.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-vhs-cyan">{donation.from}</span>
                        <span className="font-pixel text-vhs-pink">${donation.amount}</span>
                      </div>
                      <p className="text-foreground/80 font-mono text-sm mt-1">"{donation.message}"</p>
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">{donation.date}</span>
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

// Helper function
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default Profile;

