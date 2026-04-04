import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
