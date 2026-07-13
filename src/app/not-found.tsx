import type { Metadata } from "next";
import Link from "next/link";

import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeaderServer } from "@/components/shared/site-header-server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <SiteHeaderServer />
      <main id="main-content" className="flex flex-1 items-center pt-nav-h">
        <RouteFeedbackShell
          className="w-full"
          eyebrow="404"
          title="Страница не найдена"
          description="Адрес мог измениться, быть удалён или введён с ошибкой — вернёмся к началу."
          asideTitle="Куда дальше"
          asideItems={[
            "Проверьте адрес — возможно, опечатка.",
            "Воспользуйтесь поиском или каталогом.",
            "Если ссылка из закладки, обновите её.",
          ]}
          actions={
            <>
              <Button size="lg" asChild>
                <Link href="/">На главную</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/requests">К моим запросам</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:support@provodnik.app">Связаться с поддержкой</a>
              </Button>
            </>
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
