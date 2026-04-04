"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listFavoritesForCurrentUserFromSupabase } from "@/data/favorites/supabase-client";
import type { FavoriteRecord } from "@/data/favorites/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getListingBySlug, getGuideBySlug, type ListingRecord, type GuideRecord } from "@/data/supabase/queries";

export function TravelerFavoritesScreen() {
  const [favorites, setFavorites] = React.useState<FavoriteRecord[]>([]);
  const [usesBackend, setUsesBackend] = React.useState(false);

  const refresh = React.useCallback(() => {
    void (async () => {
      try {
        const persisted = await listFavoritesForCurrentUserFromSupabase();
        setFavorites(persisted);
        setUsesBackend(true);
      } catch {
        setFavorites([]);
        setUsesBackend(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const listingFavorites = favorites.filter((item) => item.target.type === "listing");
  const guideFavorites = favorites.filter((item) => item.target.type === "guide");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Избранное
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              {usesBackend
                ? "Сохранённые гиды и программы подтягиваются из вашего аккаунта, когда вы авторизованы."
                : "Сейчас избранное хранится локально на этом устройстве. Нажимайте «Сохранить» на публичных страницах, чтобы собрать короткий список."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/listings">
                Смотреть программы
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/traveler/requests">Мои запросы</Link>
            </Button>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Избранное пока пусто</CardTitle>
            <p className="text-sm text-muted-foreground">
              Нажмите «Сохранить» на странице программы или профиля гида, чтобы добавить сюда.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/listings">Перейти к программам</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/guides/maria-rostov">Посмотреть профиль гида</Link>
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
        <p className="text-sm text-muted-foreground">Здесь пока ничего нет.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{items.map(renderItem)}</div>
      )}
    </section>
  );
}

function ListingFavoriteCard({ slug }: { slug: string }) {
  const [listing, setListing] = React.useState<ListingRecord | null>(null);
  const href = `/listings/${slug}`;

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const result = await getListingBySlug(supabase, slug);
        if (!cancelled && result.data) setListing(result.data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [slug]);

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
              {listing.destinationName} · {listing.durationDays}{" "}
              {listing.durationDays === 1 ? "день" : "дней"}
            </Badge>
            <Badge variant="outline">До {listing.groupSize} человек</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Загрузка данных программы...
          </p>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-end gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={href}>
            Открыть
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function GuideFavoriteCard({ slug }: { slug: string }) {
  const [guide, setGuide] = React.useState<GuideRecord | null>(null);
  const href = `/guides/${slug}`;

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const result = await getGuideBySlug(supabase, slug);
        if (!cancelled && result.data) setGuide(result.data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const title = guide?.fullName ?? slug;

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
          <p className="text-sm text-muted-foreground">{guide.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Загрузка данных профиля гида...
          </p>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-end gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={href}>
            Открыть профиль
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

