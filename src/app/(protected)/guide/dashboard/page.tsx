import type { Metadata } from "next";

import {
  GuideDashboardScreen,
  type GuideVerificationStatus,
} from "@/features/guide/components/dashboard/guide-dashboard-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Кабинет гида",
};

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveGuideName(email: string | null | undefined) {
  if (!email) return "гид";

  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart.replace(/[._]+/g, " ").trim();

  if (!normalized) return "гид";

  return toTitleCase(normalized);
}

export default async function GuideDashboardPage() {
  const auth = await readAuthContextFromServer();

  let listingCount = 0;
  let requestCount = 0;
  let bookingCount = 0;
  let hasData = false;
  let isVerified = false;
  let guideName = deriveGuideName(auth.email);
  let verificationStatus: GuideVerificationStatus = "draft";
  let verificationNotes: string | null = null;

  if (auth.isAuthenticated) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [guideProfile, guideBookings, guideListings, guideRequests] =
          await Promise.all([
            supabase
              .from("guide_profiles")
              .select(
                "verification_status, verification_notes, display_name, rating, completed_tours",
              )
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("bookings")
              .select("id", { count: "exact" })
              .eq("guide_id", user.id),
            supabase
              .from("listings")
              .select("id", { count: "exact" })
              .eq("guide_id", user.id)
              .eq("status", "published"),
            supabase
              .from("traveler_requests")
              .select("id", { count: "exact" })
              .eq("status", "open"),
          ]);

        verificationStatus =
          (guideProfile.data?.verification_status as GuideVerificationStatus | undefined) ?? "draft";
        verificationNotes = guideProfile.data?.verification_notes ?? null;
        isVerified = verificationStatus === "approved";
        bookingCount = guideBookings.count ?? 0;
        listingCount = guideListings.count ?? 0;
        requestCount = guideRequests.count ?? 0;
        hasData = true;
        guideName =
          guideProfile.data?.display_name ?? deriveGuideName(user.email);
      }
    } catch {
      hasData = false;
      isVerified = false;
      verificationStatus = "draft";
      verificationNotes = null;
    }
  }

  return (
    <GuideDashboardScreen
      bookingCount={bookingCount}
      guideName={guideName}
      hasData={hasData}
      isVerified={isVerified}
      listingCount={listingCount}
      requestCount={requestCount}
      verificationStatus={verificationStatus}
      verificationNotes={verificationNotes}
    />
  );
}
