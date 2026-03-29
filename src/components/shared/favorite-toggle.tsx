"use client";

import * as React from "react";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isFavoriteInSupabase,
  toggleFavoriteInSupabase,
} from "@/data/favorites/supabase-client";
import { recordMarketplaceEventFromClient } from "@/data/marketplace-events/client";
import type { FavoriteTargetType } from "@/data/favorites/types";
import { cn } from "@/lib/utils";

export function FavoriteToggle({
  targetType,
  slug,
  label,
  className,
}: {
  targetType: FavoriteTargetType;
  slug: string;
  label: string;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

    async function refresh() {
      try {
        const persisted = await isFavoriteInSupabase(targetType, slug);
        if (ignore) return;
        setSaved(persisted);
      } catch {
        // Supabase unavailable — leave as unsaved
      }
    }

    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      ignore = true;
      window.removeEventListener("focus", refresh);
    };
  }, [slug, targetType]);

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      size="sm"
      className={cn("gap-2", className)}
      onClick={async () => {
        try {
          const nextSaved = await toggleFavoriteInSupabase(targetType, slug);
          setSaved(nextSaved);
        } catch {
          // Supabase unavailable — optimistic toggle
          setSaved((prev) => !prev);
        }

        void recordMarketplaceEventFromClient({
          scope: "moderation",
          requestId: null,
          bookingId: null,
          disputeId: null,
          actorId: null,
          eventType: "favorite_toggled",
          summary: `Favorite toggled for ${targetType}:${slug}`,
          detail: undefined,
          payload: {
            targetType,
            targetSlug: slug,
            userId: "supabase-user",
            persistence: "supabase",
          },
        });
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <Heart
        className={cn("size-4", saved && "fill-current")}
        aria-hidden="true"
      />
      {saved ? "Сохранено" : "Сохранить"}
    </Button>
  );
}

