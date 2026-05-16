"use client";

import { MapPin, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublicListing } from "@/data/public-listings/types";
import { getTheme } from "@/data/themes";
import { cn } from "@/lib/utils";

const paletteBySlug: Record<string, string> = {
  "rostov-food-walk":
    "from-[#154c4b] via-[#1f7a76] to-[#ed8d45]",
  "baikal-ice-safety-day":
    "from-[#17365f] via-[#2e6fb9] to-[#8fd4ff]",
  "rostov-day-trip-azov":
    "from-[#7b3f18] via-[#cc6d32] to-[#f1c788]",
};

const pillClassName =
  "rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-medium text-white/92 backdrop-blur";

export function ListingCoverArt({
  listing,
  className,
  compact = false,
}: {
  listing: PublicListing;
  className?: string;
  compact?: boolean;
}) {
  const palette =
    paletteBySlug[listing.slug] ?? "from-[#174f52] via-[#2a7e7b] to-[#e4a95d]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] text-white shadow-[0_24px_70px_rgba(20,56,63,0.26)]",
        compact ? "min-h-[15rem]" : "min-h-[23rem]",
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", palette)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.2),transparent_26%),linear-gradient(180deg,rgba(7,18,24,0.02),rgba(7,18,24,0.48))]" />
      <div className="absolute -left-10 top-14 h-36 w-36 rounded-full border border-white/24 bg-white/10 backdrop-blur-sm" />
      <div className="absolute bottom-[-2.5rem] right-[-1.5rem] h-44 w-44 rounded-full border border-white/18 bg-black/10 blur-[2px]" />

      <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge className="border-white/0 bg-white/18 text-white hover:bg-white/18">
            Хит направления
          </Badge>
          <div className="rounded-full border border-white/15 bg-black/15 px-3 py-1 text-xs font-medium backdrop-blur">
            {listing.durationDays}{" "}
            {listing.durationDays === 1
              ? "день"
              : listing.durationDays < 5
                ? "дня"
                : "дней"}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={pillClassName}>
              {listing.city}
            </span>
            {listing.themes.slice(0, 2).map((slug) => {
              const theme = getTheme(slug);
              if (!theme) return null;
              const { Icon, label } = theme;
              return (
                <span
                  key={slug}
                  className={cn(pillClassName, "inline-flex items-center gap-1.5")}
                >
                  <Icon className="size-3 shrink-0" aria-hidden />
                  {label}
                </span>
              );
            })}
          </div>

          <div className="max-w-xl space-y-2">
            <p className="flex items-center gap-2 text-sm text-white/78">
              <MapPin className="size-4" />
              {listing.region}
            </p>
            <h2
              className={cn(
                "max-w-xl text-pretty font-semibold tracking-tight text-white",
                compact ? "text-2xl sm:text-[2rem]" : "text-3xl sm:text-4xl",
              )}
            >
              {listing.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/84">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-black/14 px-3 py-1 backdrop-blur">
              <Star className="size-4 fill-current" />
              4.9
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-black/14 px-3 py-1 backdrop-blur">
              <Sparkles className="size-4" />
              До {listing.groupSizeMax} человек
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
