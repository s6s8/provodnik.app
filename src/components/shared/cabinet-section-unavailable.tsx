import Link from "next/link";

import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

type CabinetSectionUnavailableProps = {
  title: string;
  description: string;
};

/**
 * Friendly placeholder for cabinet sections that exist but are switched off for
 * the current release (feature-flagged V1 surfaces such as favorites and
 * referrals). Renders a real empty-state instead of the confusing cabinet 404
 * that a bare `notFound()` produces for an authenticated user landing on a
 * disabled route directly.
 */
export function CabinetSectionUnavailable({ title, description }: CabinetSectionUnavailableProps) {
  return (
    <RouteFeedbackShell
      eyebrow="Скоро"
      title={title}
      description={description}
      asideTitle="Что дальше"
      asideItems={[
        "Раздел появится в одном из ближайших обновлений.",
        "Пока вы можете вернуться к поездкам и запросам в кабинете.",
        "Все основные функции доступны из главного меню.",
      ]}
      actions={
        <Button size="lg" asChild>
          <Link href="/trips">
            <Home className="size-4" />
            К моим запросам
          </Link>
        </Button>
      }
    />
  );
}
