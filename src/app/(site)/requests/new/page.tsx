import type { Metadata } from "next";

import { PublicRequestCreateScreen } from "@/features/requests/components/public/public-request-create-screen";

export const metadata: Metadata = {
  title: "Новый запрос",
  description:
    "Форма создания публичного запроса на поездку с живым превью и входом в маркетплейс по спросу.",
};

export default function PublicRequestNewPage() {
  return <PublicRequestCreateScreen />;
}

