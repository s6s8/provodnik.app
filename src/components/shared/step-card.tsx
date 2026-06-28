import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StepCardProps = {
  step: string | number;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

/** Card-style step row — number badge + optional icon + body text. */
export function StepCard({ step, icon: Icon, children, className }: StepCardProps) {
  return (
    <div className={cn("flex gap-4 rounded-card border border-border bg-card p-5 shadow-card", className)}>
      <span className="mt-0.5 flex shrink-0 flex-col items-center gap-1.5">
        <span className="grid size-8 place-items-center rounded-step bg-primary/10 text-sm font-extrabold text-primary">
          {step}
        </span>
        {Icon ? <Icon className="size-4 text-primary/60" aria-hidden /> : null}
      </span>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}
