"use client";

import { Button } from "@/components/ui/button";

type TripsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TripsError({ reset }: TripsErrorProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-16 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-foreground">
          Не удалось загрузить ваши запросы
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Что-то пошло не так. Попробуйте обновить раздел ещё раз.
        </p>
      </div>
      <Button type="button" onClick={() => reset()}>
        Попробовать снова
      </Button>
    </div>
  );
}
