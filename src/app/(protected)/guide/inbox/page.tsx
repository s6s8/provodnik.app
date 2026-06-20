import type { Metadata } from "next";
import { GuideRequestsInboxScreen } from "@/features/guide/components/requests/guide-requests-inbox-screen";

export const metadata: Metadata = {
  title: "Входящие запросы",
};

export default function GuideRequestsPage() {
  return <GuideRequestsInboxScreen />;
}

