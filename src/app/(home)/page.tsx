import type { Metadata } from "next";

import { getActiveGuideDestinations, getHomepageRequests, type DestinationOption, type RequestRecord } from "@/data/supabase/queries";
import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { HomePageShell2 } from "@/features/homepage/components/homepage-shell2";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { flags } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Проводник",
};

export default async function HomePage() {
  const auth = await readAuthContextFromServer();

  let destinations: DestinationOption[] = [];
  let requests: RequestRecord[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const [destResult, reqResult] = await Promise.all([
      getActiveGuideDestinations(supabase),
      getHomepageRequests(supabase),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
  } catch {
    // both stay []
  }

  return (
    <>
      <SiteHeader
        isAuthenticated={auth.isAuthenticated}
        role={auth.role}
        email={auth.email}
        canonicalRedirectTo={auth.canonicalRedirectTo}
        userId={auth.userId}
        notificationsEnabled={flags.FEATURE_TR_NOTIFICATIONS}
      />
      <main className="pt-nav-h">
        <HomePageShell2 destinations={destinations} requests={requests} />
      </main>
    </>
  );
}
