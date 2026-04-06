import type { Metadata } from "next";

import {
  getUserBookings,
  getUserFavorites,
  getUserRequests,
} from "@/data/supabase/queries";
import { TravelerDashboardScreenStats } from "@/features/traveler/components/traveler-dashboard-screen-stats";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Кабинет путешественника",
};

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveUserName(email: string | null | undefined) {
  if (!email) return "путешественник";

  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart.replace(/[._]+/g, " ").trim();

  if (!normalized) return "путешественник";

  return toTitleCase(normalized);
}

export default async function TravelerDashboardPage() {
  const auth = await readAuthContextFromServer();

  let requestCount = 0;
  let bookingCount = 0;
  let favoriteCount = 0;
  let hasData = false;
  let userName = deriveUserName(auth.email);

  if (auth.isAuthenticated) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [reqResult, bookResult, favResult] = await Promise.all([
          getUserRequests(supabase, user.id),
          getUserBookings(supabase, user.id),
          getUserFavorites(supabase, user.id),
        ]);

        requestCount = reqResult.data?.length ?? 0;
        bookingCount = bookResult.data?.length ?? 0;
        favoriteCount = favResult.data?.length ?? 0;
        hasData = true;
        userName = deriveUserName(user.email);
      }
    } catch {
      hasData = false;
    }
  }

  return (
    <TravelerDashboardScreenStats
      bookingCount={bookingCount}
      favoriteCount={favoriteCount}
      hasData={hasData}
      requestCount={requestCount}
      userName={userName}
    />
  );
}
