"use client";

import * as React from "react";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getActiveFavoritesUserId } from "@/data/favorites/active-user";
import {
  isFavorite,
  subscribeToFavoritesChanged,
  toggleFavorite,
} from "@/data/favorites/local-store";
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
  const userId = React.useMemo(() => getActiveFavoritesUserId(), []);
  const [saved, setSaved] = React.useState(() => isFavorite(userId, targetType, slug));

  React.useEffect(() => {
    function refresh() {
      setSaved(isFavorite(userId, targetType, slug));
    }

    refresh();
    const unsubscribe = subscribeToFavoritesChanged(refresh);
    window.addEventListener("focus", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [slug, targetType, userId]);

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      size="sm"
      className={cn("gap-2", className)}
      onClick={() => toggleFavorite(userId, targetType, slug)}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <Heart
        className={cn("size-4", saved && "fill-current")}
        aria-hidden="true"
      />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

