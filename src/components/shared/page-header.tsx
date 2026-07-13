import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

/** Canonical page title block (Onest). Use on non-hero list/cabinet pages. */
export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <Badge variant="eyebrow" className="mb-2">{eyebrow}</Badge>
        ) : null}
        <h1 className="text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-on-surface">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-[60ch] text-sm leading-[1.5] text-on-surface-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
