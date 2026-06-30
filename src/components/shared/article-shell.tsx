import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ArticleShellProps = {
  children: ReactNode;
  className?: string;
};

/** Canonical prose/article page wrapper — max-w-2xl, px-gutter, py-16. */
export function ArticleShell({ children, className }: ArticleShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl px-gutter py-16", className)}>
      {children}
    </div>
  );
}
