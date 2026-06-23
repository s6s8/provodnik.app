import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { ListingSlotRow } from "@/components/listing-detail/AvailabilitySection";
import { ExcursionShapeDetail, type ListingDetailRow } from "@/components/listing-detail/ExcursionShapeDetail";
import { TourShapeDetail } from "@/components/listing-detail/TourShapeDetail";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { flags } from "@/lib/flags";

function listingRefIsUuid(ref: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: ref } = await params;
  const supabase = await createSupabaseServerClient();
  const base = supabase.from("listings").select("title, description").eq("status", "published");
  const { data } = listingRefIsUuid(ref)
    ? await base.eq("id", ref).maybeSingle()
    : await base.eq("slug", ref).maybeSingle();

  const safeDesc = data?.description ? maskPii(data.description).slice(0, 160) : "";

  return {
    title: data?.title ?? "Предложение",
    description: safeDesc,
    alternates: {
      canonical: `/listings/${ref}`,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ref } = await params;
  const supabase = await createSupabaseServerClient();

  const listingQuery = supabase.from("listings").select("*").eq("status", "published");
  const { data: listingRaw } = listingRefIsUuid(ref)
    ? await listingQuery.eq("id", ref).maybeSingle()
    : await listingQuery.eq("slug", ref).maybeSingle();

  if (!listingRaw) notFound();

  const listing = listingRaw as ListingDetailRow;
  const id = listing.id;

  if (listing.exp_type === "transfer") notFound();

  const [photosRes, scheduleRes, slotsRes, tariffsRes, guideRes] = await Promise.all([
    supabase.from("listing_photos").select("*").eq("listing_id", id).order("position"),
    supabase.from("listing_schedule").select("*").eq("listing_id", id).order("weekday"),
    supabase
      .from("listing_slots")
      .select("id, starts_at, ends_at, capacity, seats_taken, status")
      .eq("listing_id", id)
      .eq("status", "open")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase.from("listing_tariffs").select("*").eq("listing_id", id),
    supabase
      .from("guide_profiles")
      .select("user_id, slug, bio, average_rating, review_count, contact_visibility_unlocked, is_tour_operator, years_experience, specialties, languages, verification_status, profile:profiles!guide_profiles_user_id_fkey(full_name, avatar_url)")
      .eq("user_id", listing.guide_id)
      .maybeSingle(),
  ]);

  const photos = photosRes.data ?? [];
  const schedule = scheduleRes.data ?? [];
  const slots = (slotsRes.data ?? []) as ListingSlotRow[];
  const tariffs = tariffsRes.data ?? [];
  const guideRaw = guideRes.data as
    | (NonNullable<typeof guideRes.data> & {
        profile?:
          | { full_name?: string | null; avatar_url?: string | null }
          | Array<{ full_name?: string | null; avatar_url?: string | null }>
          | null;
      })
    | null;
  const guideProfile = Array.isArray(guideRaw?.profile)
    ? guideRaw.profile[0]
    : guideRaw?.profile;
  const guide = guideRaw
    ? {
        ...guideRaw,
        full_name: guideProfile?.full_name ?? null,
        avatar_url: guideProfile?.avatar_url ?? null,
      }
    : null;


  if (listing.exp_type === "tour") {
    if (flags.FEATURE_TR_TOURS) {
      const [daysRes, mealsRes, departuresRes] = await Promise.all([
        supabase.from("listing_days").select("*").eq("listing_id", id).order("day_number"),
        supabase.from("listing_meals").select("*").eq("listing_id", id),
        supabase
          .from("listing_tour_departures")
          .select("*")
          .eq("listing_id", id)
          .eq("status", "active")
          .order("start_date"),
      ]);

      return (
        <TourShapeDetail
          listing={listing}
          photos={photos}
          tariffs={tariffs}
          days={daysRes.data ?? []}
          meals={mealsRes.data ?? []}
          departures={departuresRes.data ?? []}
          guide={guide}
        />
      );
    }
    // Flag off — fall through to excursion template below
  }


  return (
    <ExcursionShapeDetail
      listing={listing}
      photos={photos}
      schedule={schedule}
      slots={slots}
      tariffs={tariffs}
      guide={guide}
    />
  );
}
