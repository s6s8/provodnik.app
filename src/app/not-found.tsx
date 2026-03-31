import Link from "next/link";

import { ArrowLeft, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

export default function NotFound() {
  return (
    <RouteFeedbackShell
      eyebrow="404"
      title="Страница не найдена"
      description="Этого адреса нет в Provodnik. Вернитесь на главную или откройте страницу входа, чтобы попасть в нужный кабинет."
      asideTitle="Безопасный выход"
      asideItems={[
        "Проверьте путь ещё раз: ссылка могла устареть.",
        "Главная страница ведёт к публичной витрине и маршрутам.",
        "Страница входа сразу перенаправит в ваш кабинет, если сессия уже активна.",
      ]}
      actions={
        <>
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              На главную
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth">
              <ArrowLeft className="size-4" />
              К входу
            </Link>
          </Button>
        </>
      }
    />
  );
}
