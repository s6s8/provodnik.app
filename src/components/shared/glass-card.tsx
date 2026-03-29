import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div className={cn("glass-card", className)} {...props}>
      {children}
    </div>
  );
}
