"use server";

import { revalidatePath } from "next/cache";

import { createNotification } from "@/lib/notifications/create-notification";
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

    const { data: request } = await supabase
      .from("traveler_requests")
      .select("traveler_id, destination")
      .eq("id", requestId)
      .maybeSingle();

    if (request && request.traveler_id && request.traveler_id !== user.id) {
      const { data: joiner } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const joinerName = joiner?.full_name ?? "Новый участник";
      const destination = (request.destination as string | null) ?? "вашу группу";

      await createNotification({
        userId: request.traveler_id as string,
        kind: "admin_alert",
        title: `${joinerName} присоединился к вашей группе`,
        body: `К запросу «${destination}» присоединился новый участник.`,
        href: `/traveler/requests/${requestId}`,
      }).catch(() => {
        // Notification is best-effort; join itself has already succeeded
      });
    }

    revalidatePath(`/requests/${requestId}`);
  } catch {
    // Silent — page will simply not re-render the join button on failure
  }
}
