import type { Metadata } from "next";

import { getSeededOpenRequests } from "@/data/open-requests/seed";
import { PublicOpenRequestsMarketplaceScreen } from "@/features/requests/components/public/public-open-requests-marketplace-screen";

export const metadata: Metadata = {
  title: "Запросы",
  description:
    "Публичные запросы на поездки: примеры групповых поездок и спроса на экскурсии.",
};

export default function PublicRequestsPage() {
  const requests = getSeededOpenRequests();

  return <PublicOpenRequestsMarketplaceScreen requests={requests} />;
}

