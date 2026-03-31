"use client";

import Link from "next/link";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

type ProtectedErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: ProtectedErrorProps) {
  const detail = error.message || "Не удалось отрисовать защищённый маршрут.";

  return (
    <RouteFeedbackShell
      eyebrow="Ошибка кабинета"
      title="Не удалось открыть рабочую область"
      description="Похоже, защищённый маршрут не собрался с первого раза. Повторите попытку или вернитесь к безопасному входу."
      asideTitle="Подсказки"
      asideItems={[
        detail,
        "Повторите загрузку после короткой паузы.",
        "Если ошибка возвращается, откройте страницу входа и войдите заново.",
      ]}
      actions={
        <>
          <Button type="button" onClick={reset}>
            <RotateCcw className="size-4" />
            Повторить
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth">
              <AlertTriangle className="size-4" />
              Перейти к входу
            </Link>
          </Button>
        </>
      }
    />
  );
}
