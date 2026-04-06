import type { Metadata } from "next";
import { TravelerDashboardScreen } from "@/features/traveler/components/traveler-dashboard-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export const metadata: Metadata = {
  title: "Мои запросы",
};

export default async function TravelerRequestsPage() {
  const auth = await readAuthContextFromServer();
  return <TravelerDashboardScreen auth={auth} />;
}
