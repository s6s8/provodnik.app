import { GuideDashboardScreen } from "@/features/guide/components/dashboard/guide-dashboard-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function GuidePage() {
  const auth = await readAuthContextFromServer();

  return <GuideDashboardScreen auth={auth} />;
}
