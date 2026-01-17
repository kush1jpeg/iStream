import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface RetroContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "chunky" | "terminal";
  glow?: boolean;
  scanlines?: boolean;
}

export const RetroContainer = ({
  children,
  className,
  variant = "default",
  glow = false,
  scanlines = false,
  ...rest
}: RetroContainerProps) => {
  return (
    <div
      {...rest}
      className={cn(
        "relative bg-card border-2 border-primary p-4",
        variant === "chunky" && "shadow-chunky",
        variant === "terminal" && "bg-gradient-terminal shadow-glow",
        glow && "shadow-glow",
        scanlines && "scanlines",
        className
      )}
    >
      {children}
    </div>
  );
};
