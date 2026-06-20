import type { Metadata } from "next";

import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { kopecksToRub } from "@/data/money";
import { BookingFormTabs } from "@/features/bookings/components/BookingFormTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Оформление бронирования",
};

function formatLabel(format: string | null): string | null {
  if (format === "private") return "Индивидуальный";
  if (format === "group") return "Групповой";
  if (format === "combo") return "Группа / Инд.";
  return null;
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/listings/${id}/book`);

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, guide_id, title, region, price_from_minor, currency, max_group_size, format, category, status, image_url",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!listing) notFound();

  const priceLabel = `${new Intl.NumberFormat("ru-RU").format(
    kopecksToRub(listing.price_from_minor),
  )} ₽`;
  const fmtLabel = formatLabel(listing.format);

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <PageHeader eyebrow="Оформление" title={listing.title} />

      <Card className="mt-6 mb-6">
        <CardContent className="grid gap-4">
          {listing.image_url ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card">
              <Image
                src={listing.image_url}
                alt={listing.title}
                fill
                sizes="(max-width: 512px) 100vw, 512px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{listing.region}</span>
            {fmtLabel ? (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {fmtLabel}
              </span>
            ) : null}
            <span className="ml-auto text-base font-semibold text-on-surface">
              от {priceLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      <BookingFormTabs listing={listing} />
    </div>
  );
}
