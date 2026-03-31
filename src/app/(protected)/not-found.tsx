import Link from "next/link";

import { ArrowLeft, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

export default function NotFound() {
  return (
    <RouteFeedbackShell
      eyebrow="404"
      title="Страница кабинета не найдена"
      description="Ссылка устарела, путь был изменён или у вас нет доступа к этому адресу. Можно вернуться на главную или открыть страницу входа."
      asideTitle="Куда дальше"
      asideItems={[
        "Проверьте адрес и попробуйте открыть его ещё раз.",
        "Войдите в Provodnik, чтобы попасть в свой кабинет.",
        "Если ссылка из старой закладки, обновите её до новой версии.",
      ]}
      actions={
        <>
          <Button asChild>
            <Link href="/auth">
              <ArrowLeft className="size-4" />
              К входу
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="size-4" />
              На главную
            </Link>
          </Button>
        </>
      }
    />
  );
}
