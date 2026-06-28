import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type InterestTagProps = {
  /** optional leading lucide icon (theme icon) */
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

/**
 * Bordered interest / theme chip (icon + label). Reused by the open-group card
 * and request cards. Tokens only — no arbitrary values.
 */
export function InterestTag({ icon: Icon, children, className }: InterestTagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-pill border border-border px-2.5 text-xs font-semibold text-ink-2",
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
