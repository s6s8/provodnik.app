import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Form field wrapper — bordered surface with a navy focus ring. The single
 * canonical input shell (icon + control compose inside). Tokens only.
 */
export function FieldShell({ children, className }: FieldShellProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-step border border-border bg-surface px-3 py-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        className,
      )}
    >
      {children}
    </div>
  );
}
