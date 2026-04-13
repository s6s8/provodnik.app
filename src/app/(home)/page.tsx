import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { getDestinations, type DestinationRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomePageShell } from "@/features/homepage/components/homepage-shell";

export default async function HomePage() {
  let destinations: DestinationRecord[] = [];
  let requests: RequestRecord[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const [destResult, reqResult] = await Promise.all([
      getDestinations(supabase),
      getOpenRequests(supabase),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
  } catch {}

  return <HomePageShell destinations={destinations} requests={requests} />;
}
