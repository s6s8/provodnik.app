import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/flags";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { getBooking } from "@/lib/supabase/bookings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { DisputeForm } from "./dispute-form";

export const metadata: Metadata = {
  title: "Открыть спор",
};

function formatDateRange(startsOn: string | null, endsOn: string | null) {
  if (!startsOn) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (!endsOn || endsOn === startsOn) return fmt(startsOn);
  return `${fmt(startsOn)} — ${fmt(endsOn)}`;
}

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TravelerBookingDisputePage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookingId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolveSearchValue(resolvedSearchParams.error);

  if (!flags.FEATURE_TR_DISPUTES) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/auth?next=/bookings/${bookingId}`);
  }

  const booking = await getBooking(bookingId);
  if (!booking) notFound();
  if (booking.traveler_id !== user.id) {
    redirect("/trips");
  }
  if (booking.status !== "confirmed") {
    redirect(`/bookings/${bookingId}`);
  }

  const guideName = resolveDisplayName("guide", {
    full_name: booking.guide_profile?.profile?.full_name,
  });
  const dateLabel = formatDateRange(
    booking.traveler_request?.starts_on ?? booking.starts_at ?? null,
    booking.traveler_request?.ends_on ?? booking.ends_at ?? null,
  );
  const tripSummary = [booking.traveler_request?.destination ?? "Маршрут", dateLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3 px-3">
        <Link href={`/bookings/${bookingId}`}>Вернуться к поездке</Link>
      </Button>

      <PageHeader
        eyebrow="Кабинет путешественника"
        title="Открыть спор"
        subtitle="Опишите, что произошло, и какой исход вы считаете правильным. Это поможет быстрее передать спор на рассмотрение."
      />

      <DisputeForm
        bookingId={bookingId}
        hasError={error === "invalid"}
        tripSummary={tripSummary}
        guideName={guideName}
      />
    </div>
  );
}
