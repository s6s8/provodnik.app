import { CheckCircle2, Clock3, Shield, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <div className="space-y-3">
        <Badge variant="outline">{eyebrow}</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon];

          return (
            <Card key={stat.title} className="border-border/70 bg-card/90">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{stat.title}</CardTitle>
                  <CardDescription>{stat.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                This route is scaffolded and ready for parallel implementation in
                its dedicated worktree.
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
