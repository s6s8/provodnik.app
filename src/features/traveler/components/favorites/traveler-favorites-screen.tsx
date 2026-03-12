"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getActiveFavoritesUserId } from "@/data/favorites/active-user";
import {
  listFavoritesForUser,
  subscribeToFavoritesChanged,
} from "@/data/favorites/local-store";
import { listFavoritesForCurrentUserFromSupabase } from "@/data/favorites/supabase-client";
import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { getSeededPublicListing } from "@/data/public-listings/seed";

export function TravelerFavoritesScreen() {
  const userId = React.useMemo(() => getActiveFavoritesUserId(), []);
  const [favorites, setFavorites] = React.useState(() => listFavoritesForUser(userId));
  const [usesBackend, setUsesBackend] = React.useState(false);

  const refresh = React.useCallback(() => {
    void (async () => {
      try {
        const persisted = await listFavoritesForCurrentUserFromSupabase();
        setFavorites(persisted);
        setUsesBackend(true);
        return;
      } catch {
        setUsesBackend(false);
      }

      setFavorites(listFavoritesForUser(userId));
    })();
  }, [userId]);

  React.useEffect(() => {
    refresh();
    const unsubscribe = subscribeToFavoritesChanged(refresh);
    window.addEventListener("focus", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const listingFavorites = favorites.filter((item) => item.target.type === "listing");
  const guideFavorites = favorites.filter((item) => item.target.type === "guide");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Traveler workspace</Badge>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Favorites
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              {usesBackend
                ? "Saved guides and listings now reload from your Supabase account when you are signed in."
                : "Saved guides and listings are stored locally on this device in the MVP baseline. Use the save controls on public pages to build your short list."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/listings">
                Browse listings
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/traveler/requests">Requests</Link>
            </Button>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>No favorites yet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tap “Save” on a listing or guide profile to keep it here.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/listings">Explore listings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/guides/maria-rostov">View a guide profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <FavoritesSection
            title="Saved listings"
            items={listingFavorites.map((item) => item.target.slug)}
            renderItem={(slug) => <ListingFavoriteCard key={slug} slug={slug} />}
          />
          <FavoritesSection
            title="Saved guides"
            items={guideFavorites.map((item) => item.target.slug)}
            renderItem={(slug) => <GuideFavoriteCard key={slug} slug={slug} />}
          />
        </div>
      )}
    </div>
  );
}

function FavoritesSection<T extends string>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: readonly T[];
  renderItem: (slug: T) => React.ReactNode;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <Separator />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{items.map(renderItem)}</div>
      )}
    </section>
  );
}

function ListingFavoriteCard({ slug }: { slug: string }) {
  const listing = getSeededPublicListing(slug);
  const href = `/listings/${slug}`;
  const title = listing?.title ?? slug;

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">
            <Link href={href} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          </CardTitle>
          <Heart className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        {listing ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {listing.city} · {listing.durationDays} day
              {listing.durationDays === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline">Up to {listing.groupSizeMax}</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Listing details are unavailable in the local seed.
          </p>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-end gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={href}>
            View
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function GuideFavoriteCard({ slug }: { slug: string }) {
  const guide = getSeededPublicGuide(slug);
  const href = `/guides/${slug}`;
  const title = guide?.displayName ?? slug;

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">
            <Link href={href} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          </CardTitle>
          <Heart className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        {guide ? (
          <p className="text-sm text-muted-foreground">{guide.headline}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Guide details are unavailable in the local seed.
          </p>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-end gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={href}>
            View profile
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

