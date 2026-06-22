import type { Metadata } from "next";

import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { MoneyBreakdown } from "@/components/trust/money-breakdown";
import { Card, CardContent } from "@/components/ui/card";
import { kopecksToRub } from "@/data/money";
import { BookingFormTabs } from "@/features/bookings/components/BookingFormTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Подать заявку на экскурсию",
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

  let guidePublic:
    | { full_name: string | null; average_rating: number | null; review_count: number | null }
    | null = null;
  try {
    const { data } = await supabase
      .from("v_guide_public_profile")
      .select("full_name, average_rating, review_count")
      .eq("user_id", listing.guide_id)
      .maybeSingle();
    guidePublic = data;
  } catch {
    guidePublic = null;
  }

  const guideName = guidePublic?.full_name?.trim() || "Проверенный гид";
  const showRating = (guidePublic?.review_count ?? 0) > 0;

  const priceLabel = `${new Intl.NumberFormat("ru-RU").format(
    kopecksToRub(listing.price_from_minor),
  )} ₽`;
  const fmtLabel = formatLabel(listing.format);

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <PageHeader eyebrow="Заявка" title="Подать заявку на экскурсию" subtitle={listing.title} />

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
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-on-surface">{guideName}</span>
            {showRating ? (
              <span className="text-muted-foreground">
                ★ {guidePublic?.average_rating} ({guidePublic?.review_count})
              </span>
            ) : null}
          </div>
          <MoneyBreakdown
            pricePerPerson={kopecksToRub(listing.price_from_minor)}
            partySize={1}
            currency="₽"
          />
        </CardContent>
      </Card>

      <BookingFormTabs listing={listing} />
    </div>
  );
}
