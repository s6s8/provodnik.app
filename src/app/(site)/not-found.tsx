import Link from "next/link";

import { ArrowLeft, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

export default function NotFound() {
  return (
    <RouteFeedbackShell
      eyebrow="404"
      title="Страница не найдена"
      description="Мы не нашли такой страницы в публичной витрине Provodnik. Вернитесь на главную или откройте страницу входа."
      asideTitle="Куда перейти"
      asideItems={[
        "Проверьте старую ссылку или закладку.",
        "Откройте главную страницу с подборкой маршрутов и направлений.",
        "Войдите в кабинет, если нужен закрытый раздел.",
      ]}
      actions={
        <>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              На главную
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth">
              <Home className="size-4" />
              К входу
            </Link>
          </Button>
        </>
      }
    />
  );
}
