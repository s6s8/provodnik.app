"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { joinRequest } from "@/lib/supabase/request-members";

/**
 * Server action: join an open request group.
 * Called from a form action — returns void so it is compatible with
 * form `action` prop typing. Error handling is silent; the page revalidates
 * on success which updates the UI.
 *
 * travelerId is always derived from the server auth session.
 */
export async function joinRequestAction(requestId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    await joinRequest(requestId, user.id);
    revalidatePath(`/requests/${requestId}`);
  } catch {
    // Silent — page will simply not re-render the join button on failure
  }
}
