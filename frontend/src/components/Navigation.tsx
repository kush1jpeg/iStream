import { GlitchText } from "./GlitchText";
import { GithubIcon, Radio, Tv, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import NotifDropdown from "./notifications";
import { useAuthStore } from "./zustand/zustand";

export const Navigation = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);


  return (
    <>
      <nav className="border-b-4 border-primary bg-card p-2 relative">
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
          <div className="flex gap-6">
            <NavItem icon={GithubIcon} label="Repo" href="https://github.com/kush1jpeg/istream" />

            <NavItem href="/shop" icon={Tv} label="Shop" active={location.pathname === "/shop"} />
            {!user ? (
              <NavItem href="/auth" icon={User} label="Login" active={location.pathname === "/auth"} />
            ) : (
              <>
                <NotifDropdown />
              </>)}

          </div>
        </div>
      </nav>

    </>);
};

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active }: NavItemProps) => {
  const isExternal = /^https?:\/\//.test(href);
  const className = cn(
    "flex items-center gap-2 px-2 py-1 border-2 transition-all",
    "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
    active
      ? "border-primary bg-primary text-primary-foreground shadow-chunky"
      : "border-muted text-muted-foreground hover:border-primary hover:text-primary"
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-mono uppercase">{label}</span>
      </a>
    );
  }

  return (
    <Link
      to={href}
      className={className}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-mono uppercase">{label}</span>
    </Link>
  );
};
