import { getDestinations, getOpenRequests, type DestinationRecord, type RequestRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomePageShell } from "@/features/homepage/components/homepage-shell";

export default async function HomePage() {
  let destinations: DestinationRecord[] = [];
  let requests: RequestRecord[] = [];

  try {
    const client = await createSupabaseServerClient();
    const [destResult, reqResult] = await Promise.all([
      getDestinations(client),
      getOpenRequests(client),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
  } catch {}

  return <HomePageShell destinations={destinations} requests={requests} />;
}
