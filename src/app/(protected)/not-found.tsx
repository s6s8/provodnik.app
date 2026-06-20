import type { Metadata } from "next";
import Link from "next/link";

import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <RouteFeedbackShell
      eyebrow="404"
      title="Страница кабинета не найдена"
      description="Ссылка устарела, путь был изменён или у вас нет доступа к этому адресу. Можно вернуться на главную или открыть другой раздел кабинета."
      asideTitle="Куда дальше"
      asideItems={[
        "Проверьте адрес и попробуйте открыть его ещё раз.",
        "Откройте нужный раздел из меню кабинета.",
        "Если ссылка из старой закладки, обновите её до новой версии.",
      ]}
      actions={
        <>
          <Button size="lg" asChild>
            <Link href="/">
              <Home className="size-4" />
              На главную
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="mailto:support@provodnik.app">Связаться с поддержкой</a>
          </Button>
        </>
      }
    />
  );
}
