import "server-only";

import { z } from "zod";

import { transitionBooking } from "@/lib/bookings/state-machine";
import { notifyDisputeOpened } from "@/lib/notifications/triggers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow, Uuid } from "@/lib/supabase/types";

const disputeStatusSchema = z.enum(["open", "under_review", "resolved", "closed"]);

const openDisputeInputSchema = z.object({
  bookingId: z.string().uuid("Некорректный идентификатор бронирования."),
  openedBy: z.string().uuid("Некорректный идентификатор автора спора."),
  reason: z.string().trim().min(1, "Опишите причину спора.").max(2_000),
  requestedOutcome: z.string().trim().max(2_000).optional().nullable(),
});

const disputeNoteInputSchema = z.object({
  disputeId: z.string().uuid("Некорректный идентификатор спора."),
  authorId: z.string().uuid("Некорректный идентификатор автора заметки."),
  note: z.string().trim().min(1, "Заметка не должна быть пустой.").max(4_000),
  internalOnly: z.boolean(),
});

const disputeResolutionInputSchema = z.object({
  disputeId: z.string().uuid("Некорректный идентификатор спора."),
  adminId: z.string().uuid("Некорректный идентификатор администратора."),
  resolutionSummary: z.string().trim().min(1, "Укажите итоговое решение.").max(4_000),
});

type DisputeStatus = z.infer<typeof disputeStatusSchema>;

type ProfileJoin = {
  id: Uuid;
  full_name: string | null;
  avatar_url: string | null;
} | {
  id: Uuid;
  full_name: string | null;
  avatar_url: string | null;
}[] | null;

type BookingJoinRow = Pick<
  BookingRow,
  "id" | "status" | "meeting_point" | "starts_at" | "ends_at" | "subtotal_minor" | "currency" | "traveler_id" | "guide_id" | "request_id" | "listing_id"
> & {
  traveler: ProfileJoin;
  guide: ProfileJoin;
  request: { destination: string | null; starts_on: string | null; ends_on: string | null } | { destination: string | null; starts_on: string | null; ends_on: string | null }[] | null;
  listing: { slug: string; title: string; region: string } | { slug: string; title: string; region: string }[] | null;
};

type DisputeRow = {
  id: Uuid;
  booking_id: Uuid;
  opened_by: Uuid;
  assigned_admin_id: Uuid | null;
  status: DisputeStatus;
  reason: string;
  summary: string | null;
  requested_outcome: string | null;
  payout_frozen: boolean;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type DisputeNoteRow = {
  id: Uuid;
  dispute_id: Uuid;
  author_id: Uuid;
  note: string;
  internal_only: boolean;
  created_at: string;
  author: ProfileJoin;
};

type DisputeListRow = DisputeRow & {
  booking: BookingJoinRow | BookingJoinRow[] | null;
};

type DisputeDetailRow = DisputeRow & {
  booking: BookingJoinRow | BookingJoinRow[] | null;
  dispute_notes: DisputeNoteRow[] | null;
};

export type DisputeNote = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  note: string;
  internalOnly: boolean;
  createdAt: string;
};

export type DisputeListItem = {
  id: string;
  bookingId: string;
  status: DisputeStatus;
  reason: string;
  summary: string | null;
  requestedOutcome: string | null;
  payoutFrozen: boolean;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    status: string;
    meetingPoint: string | null;
    startsAt: string | null;
    endsAt: string | null;
    subtotalMinor: number;
    currency: string;
    travelerId: string;
    travelerName: string;
    travelerAvatarUrl: string | null;
    guideId: string;
    guideName: string;
    guideAvatarUrl: string | null;
    destination: string;
    listingTitle: string | null;
  } | null;
};

export type DisputeDetail = DisputeListItem & {
  openedBy: string;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  notes: DisputeNote[];
};

async function getSupabaseClient() {
  return createSupabaseServerClient();
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeProfile(profile: ProfileJoin): { id: Uuid; full_name: string | null; avatar_url: string | null } | null {
  return normalizeRelation(profile);
}

function normalizeBooking(row: BookingJoinRow | BookingJoinRow[] | null): DisputeListItem["booking"] {
  const booking = normalizeRelation(row);
  if (!booking) return null;

  const traveler = normalizeProfile(booking.traveler);
  const guide = normalizeProfile(booking.guide);
  const request = normalizeRelation(booking.request);
  const listing = normalizeRelation(booking.listing);

  return {
    id: booking.id,
    status: booking.status,
    meetingPoint: booking.meeting_point,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    subtotalMinor: booking.subtotal_minor,
    currency: booking.currency,
    travelerId: booking.traveler_id,
    travelerName: traveler?.full_name?.trim() || "Путешественник",
    travelerAvatarUrl: traveler?.avatar_url ?? null,
    guideId: booking.guide_id,
    guideName: guide?.full_name?.trim() || "Гид",
    guideAvatarUrl: guide?.avatar_url ?? null,
    destination: request?.destination?.trim() || "Маршрут",
    listingTitle: listing?.title?.trim() || null,
  };
}

function mapNote(row: DisputeNoteRow): DisputeNote {
  const author = normalizeProfile(row.author);
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: author?.full_name?.trim() || "Администратор",
    authorAvatarUrl: author?.avatar_url ?? null,
    note: row.note,
    internalOnly: row.internal_only,
    createdAt: row.created_at,
  };
}

function mapListItem(row: DisputeListRow): DisputeListItem {
  return {
    id: row.id,
    bookingId: row.booking_id,
    status: row.status,
    reason: row.reason,
    summary: row.summary,
    requestedOutcome: row.requested_outcome,
    payoutFrozen: row.payout_frozen,
    assignedAdminId: row.assigned_admin_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    booking: normalizeBooking(row.booking),
  };
}

function mapDetail(row: DisputeDetailRow): DisputeDetail {
  return {
    ...mapListItem(row),
    openedBy: row.opened_by,
    resolutionSummary: row.resolution_summary,
    resolvedAt: row.resolved_at,
    notes: (row.dispute_notes ?? []).map(mapNote),
  };
}

async function currentUser() {
  const supabase = await getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) {
    throw new Error("Пользователь не авторизован.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    id: user.id as Uuid,
    role: profile?.role ?? null,
  };
}

async function ensureAdmin(userId: string) {
  const supabase = await getSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile || profile.role !== "admin") {
    throw new Error("Только администратор может выполнить это действие.");
  }
}

async function loadBooking(bookingId: string) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; traveler_id: string; guide_id: string; status: string } | null;
}

export async function openDispute(data: {
  bookingId: string;
  openedBy: string;
  reason: string;
  requestedOutcome?: string | null;
}): Promise<DisputeRow> {
  const input = openDisputeInputSchema.parse(data);
  const auth = await currentUser();

  if (auth.id !== input.openedBy) {
    throw new Error("Автор спора не совпадает с авторизованным пользователем.");
  }

  const booking = await loadBooking(input.bookingId);
  if (!booking) throw new Error("Бронирование не найдено.");
  if (!["confirmed", "completed"].includes(booking.status)) {
    throw new Error("Спор можно открыть только по подтверждённой или завершённой поездке.");
  }
  if (booking.traveler_id !== input.openedBy && booking.guide_id !== input.openedBy) {
    throw new Error("Спор может открыть только участник бронирования.");
  }

  const supabase = await getSupabaseClient();
  const { data: dispute, error } = await supabase
    .from("disputes")
    .insert({
      booking_id: input.bookingId,
      opened_by: input.openedBy,
      assigned_admin_id: null,
      status: "open",
      reason: input.reason,
      summary: input.reason,
      requested_outcome: input.requestedOutcome?.trim() || null,
      payout_frozen: false,
      resolution_summary: null,
    })
    .select("id, booking_id, opened_by, assigned_admin_id, status, reason, summary, requested_outcome, payout_frozen, resolution_summary, created_at, updated_at, resolved_at")
    .single();

  if (error) throw error;

  if (booking.status === "confirmed") {
    await transitionBooking(booking.id, "disputed", input.openedBy);
  } else {
    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ status: "disputed" })
      .eq("id", booking.id);

    if (bookingUpdateError) throw bookingUpdateError;
  }

  await notifyDisputeOpened((dispute as DisputeRow).id);

  return dispute as DisputeRow;
}

export async function getDispute(disputeId: string): Promise<DisputeDetail | null> {
  z.string().uuid().parse(disputeId);
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("disputes")
    .select(
      `
        id,
        booking_id,
        opened_by,
        assigned_admin_id,
        status,
        reason,
        summary,
        requested_outcome,
        payout_frozen,
        resolution_summary,
        created_at,
        updated_at,
        resolved_at,
        booking:bookings!booking_id(
          id,
          status,
          meeting_point,
          starts_at,
          ends_at,
          subtotal_minor,
          currency,
          traveler_id,
          guide_id,
          request_id,
          listing_id,
          traveler:profiles!traveler_id(id, full_name, avatar_url),
          guide:profiles!guide_id(id, full_name, avatar_url),
          request:traveler_requests!request_id(destination, starts_on, ends_on),
          listing:listings!listing_id(slug, title, region)
        ),
        dispute_notes:dispute_notes!dispute_id(
          id,
          dispute_id,
          author_id,
          note,
          internal_only,
          created_at,
          author:profiles!author_id(id, full_name, avatar_url)
        )
      `,
    )
    .eq("id", disputeId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;
  return mapDetail(data as DisputeDetailRow);
}

export async function getDisputes(filters?: { status?: string }): Promise<DisputeListItem[]> {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from("disputes")
    .select(
      `
        id,
        booking_id,
        opened_by,
        assigned_admin_id,
        status,
        reason,
        summary,
        requested_outcome,
        payout_frozen,
        resolution_summary,
        created_at,
        updated_at,
        resolved_at,
        booking:bookings!booking_id(
          id,
          status,
          meeting_point,
          starts_at,
          ends_at,
          subtotal_minor,
          currency,
          traveler_id,
          guide_id,
          request_id,
          listing_id,
          traveler:profiles!traveler_id(id, full_name, avatar_url),
          guide:profiles!guide_id(id, full_name, avatar_url),
          request:traveler_requests!request_id(destination, starts_on, ends_on),
          listing:listings!listing_id(slug, title, region)
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as DisputeListRow[]).map(mapListItem);
}

export async function addDisputeNote(
  disputeId: string,
  authorId: string,
  note: string,
  internalOnly: boolean,
): Promise<DisputeNote> {
  const input = disputeNoteInputSchema.parse({ disputeId, authorId, note, internalOnly });
  const auth = await currentUser();
  if (auth.id !== input.authorId) {
    throw new Error("Автор заметки не совпадает с авторизованным пользователем.");
  }
  await ensureAdmin(input.authorId);

  const supabase = await getSupabaseClient();
  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select("id")
    .eq("id", input.disputeId)
    .maybeSingle();

  if (disputeError) throw disputeError;
  if (!dispute) throw new Error("Спор не найден.");

  const { data, error } = await supabase
    .from("dispute_notes")
    .insert({
      dispute_id: input.disputeId,
      author_id: input.authorId,
      note: input.note,
      internal_only: input.internalOnly,
    })
    .select(
      "id, dispute_id, author_id, note, internal_only, created_at, author:profiles!author_id(id, full_name, avatar_url)",
    )
    .single();

  if (error) throw error;
  return mapNote(data as DisputeNoteRow);
}

export async function assignDisputeToAdmin(
  disputeId: string,
  adminId: string,
): Promise<DisputeDetail> {
  const auth = await currentUser();
  if (auth.id !== adminId) {
    throw new Error("Администратор не совпадает с авторизованным пользователем.");
  }
  await ensureAdmin(adminId);

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("disputes")
    .update({
      assigned_admin_id: adminId,
      status: "under_review",
    })
    .eq("id", disputeId);

  if (error) throw error;

  const detail = await getDispute(disputeId);
  if (!detail) throw new Error("Спор не найден.");
  return detail;
}

export async function resolveDispute(
  disputeId: string,
  adminId: string,
  resolutionSummary: string,
): Promise<DisputeDetail> {
  const input = disputeResolutionInputSchema.parse({ disputeId, adminId, resolutionSummary });
  const auth = await currentUser();
  if (auth.id !== input.adminId) {
    throw new Error("Администратор не совпадает с авторизованным пользователем.");
  }
  await ensureAdmin(input.adminId);

  const supabase = await getSupabaseClient();
  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select("id, booking_id")
    .eq("id", input.disputeId)
    .maybeSingle();

  if (disputeError) throw disputeError;
  if (!dispute) throw new Error("Спор не найден.");

  const { error: updateError } = await supabase
    .from("disputes")
    .update({
      status: "resolved",
      resolution_summary: input.resolutionSummary,
      resolved_at: new Date().toISOString(),
      assigned_admin_id: input.adminId,
    })
    .eq("id", input.disputeId);

  if (updateError) throw updateError;

  const { error: bookingUpdateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", dispute.booking_id);

  if (bookingUpdateError) throw bookingUpdateError;

  const detail = await getDispute(input.disputeId);
  if (!detail) throw new Error("Не удалось загрузить обновлённый спор.");
  return detail;
}
