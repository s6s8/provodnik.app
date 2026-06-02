"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function resolveAdminErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (
    message.includes("доступ только для администраторов") ||
    message.includes("требуется вход администратора")
  ) {
    return "Сессия не подтверждена как администратор. Войдите под админским аккаунтом.";
  }

  if (message.includes("supabase admin environment")) {
    return "Серверная часть админки не настроена в этом окружении. Обратитесь к разработчикам.";
  }

  return "Не удалось выполнить действие в админке. Попробуйте ещё раз или напишите в поддержку.";
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const copy = resolveAdminErrorMessage(error);

  return (
    <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-destructive/30 bg-destructive/10 p-6 shadow-card">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="space-y-3">
          <p className="text-sm font-semibold text-destructive">Ошибка админки</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Действие не выполнено
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          Повторить
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">К панели</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth?next=%2Fadmin%2Fdashboard">Войти снова</Link>
        </Button>
      </div>
    </div>
  );
}
