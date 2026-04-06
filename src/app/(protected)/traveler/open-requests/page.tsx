import type { Metadata } from "next";
import { TravelerOpenRequestsScreen } from "@/features/traveler/components/open-requests/traveler-open-requests-screen";

export const metadata: Metadata = {
  title: "Открытые запросы",
};

export default function TravelerOpenRequestsPage() {
  return <TravelerOpenRequestsScreen />;
}

