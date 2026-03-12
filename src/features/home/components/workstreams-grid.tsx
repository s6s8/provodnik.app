import Link from "next/link";
import { Database, LayoutTemplate, ShieldAlert, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const workstreams = [
  {
    title: "Foundation",
    description:
      "Shared shell, auth boundary, design system wrappers, and app-level wiring.",
    href: "/",
    icon: LayoutTemplate,
  },
  {
    title: "Traveler",
    description:
      "Requests, bookings, favorites, and the account experience for demand-side users.",
    href: "/traveler",
    icon: UserRound,
  },
  {
    title: "Guide",
    description:
      "Onboarding, listing management, offer workflows, and booking operations for supply.",
    href: "/guide",
    icon: ShieldAlert,
  },
  {
    title: "Admin + Data",
    description:
      "Moderation, refunds, disputes, Supabase contracts, and typed backend integration.",
    href: "/admin",
    icon: Database,
  },
];

export function WorkstreamsGrid() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Parallel implementation lanes
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Worktree ownership is already split so multiple agents can code
          without stepping on the same files.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workstreams.map((workstream) => {
          const Icon = workstream.icon;

          return (
            <Card key={workstream.title} className="border-border/70 bg-card/80">
              <CardHeader className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle>{workstream.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {workstream.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline">
                  <Link href={workstream.href}>Open workspace</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
