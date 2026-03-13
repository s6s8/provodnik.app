import { CheckCircle2, Clock3, Shield, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const iconMap = {
  trust: Shield,
  speed: Clock3,
  commerce: Wallet,
  readiness: CheckCircle2,
} as const;

type DashboardStat = {
  title: string;
  description: string;
  icon: keyof typeof iconMap;
};

export function DashboardOverview({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats: readonly DashboardStat[];
}) {
  return (
    <div className="space-y-8">
      <section className="section-frame rounded-[2.3rem] p-6 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <Badge variant="secondary">{eyebrow}</Badge>
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold text-foreground sm:text-6xl">{title}</h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon];

          return (
            <article
              key={stat.title}
              className="section-frame rounded-[1.9rem] p-5 shadow-[0_16px_40px_rgba(35,45,49,0.06)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-foreground">{stat.title}</h2>
                  <p className="text-sm leading-7 text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
