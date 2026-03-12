import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow, BookingStatus, Uuid } from "@/lib/supabase/types";

export type BookingRecord = {
  id: string;
  travelerId: string;
  guideId: string;
  requestId: string | null;
  offerId: string | null;
  listingId: string | null;
  status: BookingStatus;
  partySize: number;
  startsAt: string | null;
  endsAt: string | null;
  subtotalMinor: number;
  depositMinor: number;
  remainderMinor: number;
  currency: string;
  cancellationPolicySnapshot: unknown;
  meetingPoint: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    travelerId: row.traveler_id,
    guideId: row.guide_id,
    requestId: row.request_id,
    offerId: row.offer_id,
    listingId: row.listing_id,
    status: row.status,
    partySize: row.party_size,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    subtotalMinor: row.subtotal_minor,
    depositMinor: row.deposit_minor,
    remainderMinor: row.remainder_minor,
    currency: row.currency,
    cancellationPolicySnapshot: row.cancellation_policy_snapshot,
    meetingPoint: row.meeting_point,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBookingById(
  id: Uuid,
): Promise<BookingRecord | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, traveler_id, guide_id, request_id, offer_id, listing_id, status, party_size, starts_at, ends_at, subtotal_minor, deposit_minor, remainder_minor, currency, cancellation_policy_snapshot, meeting_point, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;
  return mapRow(data as BookingRow);
}

export async function listBookingsForTraveler(
  travelerId: Uuid,
): Promise<BookingRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, traveler_id, guide_id, request_id, offer_id, listing_id, status, party_size, starts_at, ends_at, subtotal_minor, deposit_minor, remainder_minor, currency, cancellation_policy_snapshot, meeting_point, created_at, updated_at",
    )
    .eq("traveler_id", travelerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as BookingRow[]).map(mapRow);
}

export async function listBookingsForGuide(
  guideId: Uuid,
): Promise<BookingRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, traveler_id, guide_id, request_id, offer_id, listing_id, status, party_size, starts_at, ends_at, subtotal_minor, deposit_minor, remainder_minor, currency, cancellation_policy_snapshot, meeting_point, created_at, updated_at",
    )
    .eq("guide_id", guideId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as BookingRow[]).map(mapRow);
}

