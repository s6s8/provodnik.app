import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideOfferRow, Uuid } from "@/lib/supabase/types";

export type GuideOfferRecord = {
  id: string;
  requestId: string;
  guideId: string;
  listingId: string | null;
  title: string | null;
  message: string | null;
  priceMinor: number;
  currency: string;
  capacity: number;
  startsAt: string | null;
  endsAt: string | null;
  inclusions: string[];
  expiresAt: string | null;
  status: GuideOfferRow["status"];
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: GuideOfferRow): GuideOfferRecord {
  return {
    id: row.id,
    requestId: row.request_id,
    guideId: row.guide_id,
    listingId: row.listing_id,
    title: row.title,
    message: row.message,
    priceMinor: row.price_minor,
    currency: row.currency,
    capacity: row.capacity,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    inclusions: row.inclusions,
    expiresAt: row.expires_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getGuideOfferById(
  id: Uuid,
): Promise<GuideOfferRecord | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .select(
      "id, request_id, guide_id, listing_id, title, message, price_minor, currency, capacity, starts_at, ends_at, inclusions, expires_at, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;
  return mapRow(data as GuideOfferRow);
}

export async function listGuideOffersForRequest(
  requestId: Uuid,
): Promise<GuideOfferRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .select(
      "id, request_id, guide_id, listing_id, title, message, price_minor, currency, capacity, starts_at, ends_at, inclusions, expires_at, status, created_at, updated_at",
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as GuideOfferRow[]).map(mapRow);
}

