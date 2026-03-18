import { GuideRequestsInboxScreen } from "@/features/guide/components/requests/guide-requests-inbox-screen";
import { listTravelerRequests } from "@/data/traveler-request/local-store";

export default async function GuideRequestsPage() {
  const items = await listTravelerRequests();
  return <GuideRequestsInboxScreen items={items} />;
}

