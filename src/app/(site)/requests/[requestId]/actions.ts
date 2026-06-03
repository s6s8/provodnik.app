"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { joinRequest } from "@/lib/supabase/request-members";

export type JoinRequestActionResult = {
  error: string | null;
  joined?: boolean;
};

/**
 * Server action: join an open request group.
 * travelerId is always derived from the server auth session.
 */
export async function joinRequestAction(
  requestId: string,
): Promise<JoinRequestActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/auth?next=/requests/${requestId}`);
  }

  try {
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
      }).catch((error) => {
        console.error("[joinRequestAction] notification skipped:", error);
      });
    }

    revalidatePath(`/requests/${requestId}`);
    return { error: null, joined: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.message.startsWith("NEXT_"))
    ) {
      throw error;
    }

    console.error("[joinRequestAction] failed to join request:", error);
    return {
      error:
        error instanceof Error ? error.message : "Не удалось присоединиться.",
    };
  }
}
