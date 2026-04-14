import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { flags } from "@/lib/flags";
import type { ListingRow } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function TransferCrossSell({ listing }: { listing: ListingRow }) {
  const supabase = await createSupabaseServerClient();
  const { data: related } = await supabase
    .from("listings")
    .select("id, title, price_from_minor, image_url, average_rating")
    .eq("status", "published")
    .eq("region", listing.region)
    .in("exp_type", ["excursion", "waterwalk", "masterclass"])
    .neq("id", listing.id)
    .limit(4);
  if (!related || related.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Экскурсии рядом</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {related.map((r) => (
          <a
            key={r.id}
            href={`/listings/${r.id}`}
            className="block rounded-glass border border-border hover:shadow-glass transition-shadow"
          >
            {r.image_url && (
              <img
                src={r.image_url}
                alt={r.title}
                className="w-full aspect-video object-cover rounded-t-glass"
              />
            )}
            <div className="p-2">
              <p className="text-sm font-medium line-clamp-2">{r.title}</p>
              <p className="text-xs text-muted-foreground">от {Math.round(r.price_from_minor / 100)} ₽</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default async function TransferListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!flags.FEATURE_TR_V1) notFound();

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!listing || listing.exp_type !== "transfer") notFound();

  const row = listing as ListingRow;
  const priceRub = Math.round(row.price_from_minor / 100);
  const locationLabel = [row.region, row.city].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto w-full max-w-page space-y-8 px-[clamp(20px,4vw,48px)] pb-16 pt-8">
      <section className="space-y-4">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-glass border border-border bg-muted">
          {row.image_url ? (
            <img src={row.image_url} alt={row.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            {locationLabel ? (
              <p className="text-sm text-muted-foreground">{locationLabel}</p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{row.title}</h1>
          </div>
          <Badge variant="outline">{row.status}</Badge>
        </div>
      </section>

      <Separator />

      <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
        <CardHeader>
          <CardTitle>Маршрут</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">{row.pickup_point_text ?? "—"}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">{row.dropoff_point_text ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
        <CardHeader>
          <CardTitle>Детали</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {row.vehicle_type ? <p>Транспорт: {row.vehicle_type}</p> : null}
          <p>Вместимость: до {row.max_group_size} чел.</p>
          {row.baggage_allowance ? <p>Багаж: {row.baggage_allowance}</p> : null}
          {row.duration_minutes != null ? <p>Длительность: {row.duration_minutes} мин</p> : null}
        </CardContent>
      </Card>

      <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-3xl font-semibold">
              {priceRub} ₽
            </p>
            <p className="text-sm text-muted-foreground">За поездку</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/listings/${id}/book`}>Забронировать</Link>
          </Button>
        </CardContent>
      </Card>

      {row.description ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Описание</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{row.description}</p>
        </section>
      ) : null}

      <Separator />

      <TransferCrossSell listing={row} />
    </main>
  );
}
