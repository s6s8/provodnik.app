import { TravelerDashboardScreen } from "@/features/traveler/components/traveler-dashboard-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function TravelerRequestsPage() {
  const auth = await readAuthContextFromServer();
  return <TravelerDashboardScreen auth={auth} />;
}
