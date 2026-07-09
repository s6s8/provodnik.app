/**
 * guide-availability-blocks.ts — guide calendar blocks service layer (server-only).
 *
 * Layer B of the three-layer availability model (A = is_available master switch,
 * C = platform account_status). guideId is always taken from the auth session —
 * never accepted as untrusted input for writes. RLS is the real boundary; these
 * helpers mirror it and add friendly resolution.
 */

import "server-only";

import { ActionError } from "@/lib/actions/create-action";
import {
  buildBlockIntervals,
  isIntervalBlocked,
  type CreateBlockInput,
} from "@/lib/availability/blocks";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TABLE = "guide_availability_blocks";

export interface GuideAvailabilityBlockRow {
  id: string;
  guide_id: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  reason: string | null;
  source: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

async function currentGuideId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new ActionError("Требуется вход");
  return user.id;
}

/** Active (not soft-deleted) blocks for the signed-in guide, earliest first. */
export async function listOwnActiveBlocks(): Promise<GuideAvailabilityBlockRow[]> {
  const guideId = await currentGuideId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("guide_id", guideId)
    .is("deleted_at", null)
    .order("start_at", { ascending: true });
  if (error) throw error;
  return (data as GuideAvailabilityBlockRow[]) ?? [];
}

/**
 * Create a calendar block for the signed-in guide.
 * Returns the count of the guide's own overlapping offers/bookings so the caller
 * can warn that closing the period does not cancel existing commitments.
 */
export async function createOwnBlock(
  input: CreateBlockInput,
): Promise<{ overlappingCommitments: number }> {
  const guideId = await currentGuideId();
  const intervals = buildBlockIntervals(input);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from(TABLE).insert(
    intervals.map((interval) => ({
      guide_id: guideId,
      start_at: interval.startAt,
      end_at: interval.endAt,
      all_day: interval.allDay,
      reason: input.reason?.trim() ? input.reason.trim() : null,
      source: "manual",
      created_by: guideId,
    })),
  );
  if (error) throw error;

  // Existing commitments are never cancelled by a new block — only counted so the
  // guide can be warned. Offers carry the reliable time; every booking derives
  // from an accepted offer, so pending+accepted offers cover both.
  const { data: offers } = await supabase
    .from("guide_offers")
    .select("starts_at, ends_at")
    .eq("guide_id", guideId)
    .in("status", ["pending", "accepted"])
    .not("starts_at", "is", null)
    .not("ends_at", "is", null);

  const blockIntervals = intervals.map((interval) => ({ start_at: interval.startAt, end_at: interval.endAt }));
  const overlappingCommitments = (
    (offers as { starts_at: string; ends_at: string }[]) ?? []
  ).filter((o) => isIntervalBlocked(blockIntervals, o.starts_at, o.ends_at)).length;

  return { overlappingCommitments };
}

/** Soft-delete one of the signed-in guide's blocks (keeps the audit trail). */
export async function softDeleteOwnBlock(blockId: string): Promise<void> {
  const guideId = await currentGuideId();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", blockId)
    .eq("guide_id", guideId)
    .is("deleted_at", null);
  if (error) throw error;
}

/**
 * Layer B resolver used by the offer guard: does the guide have an active block
 * intersecting [startAt, endAt)? Mirrors the guide_offers_insert RLS conjunct so
 * the UI can show a friendly message before the DB rejects the insert.
 */
export async function isGuideIntervalBlocked(
  guideId: string,
  startAt: string,
  endAt: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("start_at, end_at")
    .eq("guide_id", guideId)
    .is("deleted_at", null);
  if (error) throw error;
  return isIntervalBlocked(
    (data as { start_at: string; end_at: string }[]) ?? [],
    startAt,
    endAt,
  );
}
