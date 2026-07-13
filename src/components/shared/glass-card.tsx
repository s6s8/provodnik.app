import { Slot } from "radix-ui";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Render the glass chrome on the child element (e.g. a Link or article). */
  asChild?: boolean;
};

export function GlassCard({
  children,
  className,
  asChild = false,
  ...props
}: GlassCardProps) {
  const Component = asChild ? Slot.Root : "div";

  return (
    <Component
      className={cn(
        "bg-glass backdrop-blur-xl border border-glass-border shadow-glass rounded-glass",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
