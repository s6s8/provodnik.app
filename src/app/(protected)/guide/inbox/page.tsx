import type { Metadata } from "next";
import { GuideRequestsInboxScreen } from "@/features/guide/components/requests/guide-requests-inbox-screen";

export const metadata: Metadata = {
  title: "Запросы путешественников",
};

export default function GuideRequestsPage() {
  return <GuideRequestsInboxScreen />;
}

