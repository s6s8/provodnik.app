import { Globe2, MapPinned, Shield, Sparkles } from "lucide-react";

import { FavoriteToggle } from "@/components/shared/favorite-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicGuideProfile } from "@/data/public-guides/types";

function initials(name: string) {
  return name
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function PublicGuideProfileBasics({ guide }: { guide: PublicGuideProfile }) {
  const trustCount = Object.values(guide.trustMarkers).filter(Boolean).length;
  const trustTotal = Object.keys(guide.trustMarkers).length;

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-[1.75rem] bg-primary/10 text-lg font-semibold text-primary">
                {initials(guide.displayName)}
              </div>
              <div className="min-w-0 space-y-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl">
                    {guide.displayName}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {guide.headline}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <MapPinned className="size-3" />
                    {guide.homeBase}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="size-3" />
                    {guide.yearsExperience}y experience
                  </Badge>
                  <Badge
                    variant={trustCount >= 3 ? "secondary" : "outline"}
                    className="gap-1"
                  >
                    <Shield className="size-3" />
                    Trust {trustCount}/{trustTotal}
                  </Badge>
                </div>
              </div>
            </div>
            <FavoriteToggle
              targetType="guide"
              slug={guide.slug}
              label={`Save guide ${guide.displayName}`}
              className="shrink-0"
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="text-sm leading-6 text-muted-foreground">{guide.bio}</p>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">At a glance</CardTitle>
          <CardDescription>
            Coverage and operating details visible to travelers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-2 text-sm font-medium">Regions</p>
            <div className="flex flex-wrap gap-2">
              {guide.regions.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-2 text-sm font-medium">Languages</p>
            <div className="flex flex-wrap gap-2">
              {guide.languages.map((item) => (
                <Badge key={item} variant="outline" className="gap-1">
                  <Globe2 className="size-3" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

