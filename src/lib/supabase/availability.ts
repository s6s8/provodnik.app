import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ActionError } from "@/lib/actions/create-action";

import { createSupabaseAdminClient } from "./admin";
import { createSupabaseServerClient } from "./server";

type Actor = { userId: string; role: "guide" | "admin" };

async function writeAvailability(
  client: SupabaseClient,
  guideId: string,
  available: boolean,
  actor: Actor,
): Promise<void> {
  const { error } = await client
    .from("guide_profiles")
    .update({ is_available: available })
    .eq("user_id", guideId);
  if (error) throw error;

  // Audit is secondary — never fail the toggle if the event insert fails.
  try {
    const { error: eventError } = await client.from("guide_availability_events").insert({
      guide_id: guideId,
      actor_id: actor.userId,
      actor_role: actor.role,
      available,
    });
    if (eventError) throw eventError;
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "guide-availability-event" } });
  }
}

/** Guide toggling their own availability. Identity comes from the session, never input. */
export async function setOwnAvailability(available: boolean): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ActionError("Требуется вход");
  await writeAvailability(supabase, user.id, available, { userId: user.id, role: "guide" });
}

/** Admin overriding a guide's availability. Caller must already be an authenticated admin. */
export async function setGuideAvailabilityByAdmin(
  guideId: string,
  available: boolean,
  adminId: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  await writeAvailability(admin, guideId, available, { userId: adminId, role: "admin" });
}
