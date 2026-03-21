import type { Metadata } from "next";

import { PublicRequestsMarketplaceScreen } from "@/features/requests/components/public/public-requests-marketplace-screen";

export const metadata: Metadata = {
  title: "Маркетплейс запросов",
  description: "Присоединяйтесь к группам и путешествуйте по лучшей цене.",
};

export default function RequestsPage() {
  return <PublicRequestsMarketplaceScreen />;
}

