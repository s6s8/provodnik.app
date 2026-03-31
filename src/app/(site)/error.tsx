"use client";

import Link from "next/link";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

type SiteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteError({ error, reset }: SiteErrorProps) {
  const detail = error.message || "Не удалось отрисовать публичную страницу.";

  return (
    <RouteFeedbackShell
      eyebrow="Ошибка страницы"
      title="Не удалось загрузить витрину"
      description="Публичная страница не собрала контент с первого раза. Повторите попытку или вернитесь на главную."
      asideTitle="Что можно сделать"
      asideItems={[
        detail,
        "Нажмите «Повторить», чтобы запросить страницу ещё раз.",
        "Если проблема не исчезает, откройте главную страницу Provodnik.",
      ]}
      actions={
        <>
          <Button type="button" onClick={reset}>
            <RotateCcw className="size-4" />
            Повторить
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <AlertTriangle className="size-4" />
              На главную
            </Link>
          </Button>
        </>
      }
    />
  );
}
