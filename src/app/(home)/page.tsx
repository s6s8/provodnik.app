import { getDestinations, getOpenRequests, type DestinationRecord, type RequestRecord } from "@/data/supabase/queries";
import { HomePageShell } from "@/features/homepage/components/homepage-shell";

export default async function HomePage() {
  let destinations: DestinationRecord[] = [];
  let requests: RequestRecord[] = [];

  try {
    const [destResult, reqResult] = await Promise.all([
      getDestinations(null as any),
      getOpenRequests(null as any),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
  } catch {}

  return <HomePageShell destinations={destinations} requests={requests} />;
}
