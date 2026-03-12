import { ShieldCheck, Sparkles, Wallet, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const items = [
  {
    title: "Lower-friction demand capture",
    description:
      "Travelers can create structured requests instead of forcing every need into a listing-first funnel.",
    icon: Sparkles,
  },
  {
    title: "Fast response discipline",
    description:
      "Guide response time is a product primitive because slow supply kills marketplace conversion.",
    icon: Zap,
  },
  {
    title: "Trust that survives scale",
    description:
      "Verification, reviews, moderation, and explicit booking states are part of the MVP baseline.",
    icon: ShieldCheck,
  },
  {
    title: "Healthy guide economics",
    description:
      "The product is positioned around lower commission and better-qualified demand than incumbent channels.",
    icon: Wallet,
  },
];

export function FoundationGrid() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="border-border/70 bg-card/80">
            <CardHeader className="space-y-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="space-y-2">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="text-sm leading-6">
                  {item.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Shared baseline and route structure are already in place so each
              worktree can build independently.
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
