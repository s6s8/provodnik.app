import "server-only";

import { hasAdminRole } from "@/lib/auth/admin-access";
import { hasSupabaseEnv } from "@/lib/env";
import { getBooking } from "@/lib/supabase/bookings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingViewerRole = "traveler" | "guide" | "admin";

export async function viewerRoleForBooking(
  bookingId: string,
): Promise<BookingViewerRole | null> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const [booking, profileResult] = await Promise.all([
      getBooking(bookingId),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (!booking) return null;
    if (booking.traveler_id === user.id) return "traveler";
    if (booking.guide_id === user.id) return "guide";

    const profileRole =
      (profileResult.data as { role: string | null } | null)?.role ?? null;
    if (
      hasAdminRole({
        profileRole,
        appMetadataRole: user.app_metadata?.role as string | undefined,
      })
    ) {
      return "admin";
    }

    return null;
  } catch {
    return null;
  }
}
