import type { Metadata } from "next";

import { GuideRequestsInboxScreen } from "@/features/guide/components/requests/guide-requests-inbox-screen";

export const metadata: Metadata = {
  title: "Запросы",
};

export default function GuidePage() {
  return <GuideRequestsInboxScreen />;
}
