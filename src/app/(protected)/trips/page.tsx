import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getDestinations } from "@/data/supabase/queries";
import { pinElistaInspirations } from "@/features/traveler/components/empty-cabinet/pin-elista";
import { TravelerRequestsScreen } from "@/features/traveler/components/requests/traveler-requests-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getActiveRequests,
  getConfirmedBookings,
  getJoinedRequests,
  getTerminalRequests,
} from "@/lib/supabase/traveler-requests";

export const metadata: Metadata = {
  title: "Кабинет путешественника",
  alternates: {
    canonical: "/trips",
  },
};

export default async function TripsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/trips");

  const [activeRequests, confirmedBookings, joinedGroups, terminalRequests, destinations] =
    await Promise.all([
      getActiveRequests(user.id),
      getConfirmedBookings(user.id),
      getJoinedRequests(user.id),
      getTerminalRequests(user.id),
      getDestinations(supabase),
    ]);
  const inspirations = pinElistaInspirations(destinations.data ?? []);

  return (
    <TravelerRequestsScreen
      activeRequests={activeRequests}
      confirmedBookings={confirmedBookings}
      joinedGroups={joinedGroups}
      terminalRequests={terminalRequests}
      inspirations={inspirations}
    />
  );
}
