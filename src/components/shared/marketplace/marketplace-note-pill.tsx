import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

export function MarketplaceNotePill({ children, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-full border border-border/70 bg-white/74 px-4 py-2 text-sm text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

