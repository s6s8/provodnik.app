import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MapPinned, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
  "Request-first marketplace for Russia tours",
  "Group formation for budget-sensitive travelers",
  "Guide verification, reviews, and booking-state trust layer",
];

export function HeroSection() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div className="space-y-6">
        <Badge variant="outline" className="rounded-full px-3 py-1">
          MVP baseline committed for parallel implementation
        </Badge>

        <div className="space-y-4">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Start with the transaction loop, not another tour catalog.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Provodnik is being structured as a request-first marketplace for
            tours and excursions across Russia: listings, traveler requests,
            guide offers, deposits, reviews, and moderation in one product.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/traveler">
              Open traveler workspace
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/guide">Open guide workspace</Link>
          </Button>
        </div>

        <div className="grid gap-3 text-sm text-muted-foreground">
          {highlights.map((highlight) => (
            <div key={highlight} className="flex items-start gap-3">
              <span className="mt-1 size-2 rounded-full bg-primary" />
              <p>{highlight}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Metric
            icon={<MapPinned className="size-5" />}
            label="Launch wedge"
            value="1 to 3 regions"
          />
          <Metric
            icon={<UsersRound className="size-5" />}
            label="Core behavior"
            value="Request + join group"
          />
          <Metric
            icon={<Compass className="size-5" />}
            label="Baseline route map"
            value="Public + traveler + guide + admin"
          />
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-medium text-foreground">{value}</p>
    </div>
  );
}
