import { GlitchText } from "./GlitchText";
import { Radio, Tv, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

export const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="border-b-4 border-primary bg-card p-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-terminal opacity-50" />
      
      <div className="container mx-auto flex items-center justify-between relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Radio className="w-8 h-8 text-primary" />
            </div>
          </div>
          <GlitchText 
            text="iSTREAM" 
            as="h1" 
            className="text-2xl font-pixel text-primary"
          />
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-6">
          <NavItem href="/" icon={Tv} label="Browse" active={location.pathname === "/"} />
          <NavItem href="/" icon={Radio} label="Live" active={false} />
          <NavItem href="/auth" icon={User} label="Login" active={location.pathname === "/auth"} />
          <NavItem href="/" icon={Settings} label="Settings" active={false} />
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active }: NavItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-2 transition-all",
        "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
        active 
          ? "border-primary bg-primary text-primary-foreground shadow-chunky" 
          : "border-muted text-muted-foreground hover:border-primary hover:text-primary"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-mono uppercase">{label}</span>
    </Link>
  );
};
