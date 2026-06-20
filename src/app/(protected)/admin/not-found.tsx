import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return (
    <RouteFeedbackShell
      eyebrow="404"
      title="Страница админки не найдена"
      description="Этот раздел не существует или был перемещён."
      asideTitle="Навигация"
      asideItems={[
        "Проверьте адрес.",
        "Раздел мог быть переименован.",
        "Вернитесь к панели управления.",
      ]}
      actions={
        <>
          <Button size="lg" asChild>
            <Link href="/admin/dashboard">К панели</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">На главную</Link>
          </Button>
        </>
      }
    />
  );
}
