import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PublicRequestDetailScreen } from "@/features/requests/components/public/public-request-detail-screen";
import { getSeededOpenRequestById } from "@/data/open-requests/seed";

export const metadata: Metadata = {
  title: "Детали запроса",
  description: "Подробности открытой группы путешественников.",
};

export default function RequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  const request = getSeededOpenRequestById(params.requestId);

  if (!request) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="editorial-kicker">Запрос не найден</p>
          <h1 className="text-3xl font-semibold tracking-tight">404</h1>
        </div>
        <Button asChild variant="default" size="lg" className="rounded-full">
          <Link href="/requests">Вернуться в биржу</Link>
        </Button>
      </div>
    );
  }

  return <PublicRequestDetailScreen request={request} />;
}

