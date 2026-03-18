import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badges?: string[];
  rightColumn?: ReactNode;
};

export function MarketplaceHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  badges,
  rightColumn,
}: Props) {
  return (
    <section className="section-frame overflow-hidden rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Icon className="size-4 text-primary" />
            {eyebrow}
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground">
            {description}
          </p>
          {badges?.length ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((label) => (
                <Badge
                  key={label}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10"
                >
                  {label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {rightColumn ? <div className="grid gap-4">{rightColumn}</div> : null}
      </div>
    </section>
  );
}

