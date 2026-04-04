import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

type RouteFeedbackShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideItems: string[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function RouteFeedbackShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideItems,
  actions,
  children,
  className,
}: RouteFeedbackShellProps) {
  return (
    <section className={cn("relative isolate overflow-hidden px-4 py-8 sm:px-6 lg:px-8", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[160px] -top-[220px] size-[500px] rounded-full bg-primary/[0.12] blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[180px] -right-[120px] size-[400px] rounded-full bg-brand-light/[0.18] blur-[100px]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(260px,0.88fr)]">
          <GlassCard className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_42%)]" />

            <div className="relative space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{eyebrow}</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                  {description}
                </p>
              </div>

              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}

              {children ? <div className="pt-2">{children}</div> : null}
            </div>
          </GlassCard>

          <GlassCard className="relative overflow-hidden rounded-[2rem] p-6 sm:p-7">
            <div className="relative space-y-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-foreground">{asideTitle}</p>
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_16%,transparent)]" />
              </div>

              <ul className="space-y-3">
                {asideItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/60 bg-background/55 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
