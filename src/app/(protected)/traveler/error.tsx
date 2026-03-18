"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Что-то пошло не так</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Попробуйте обновить страницу или вернуться к основным разделам кабинета.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset}>
              Попробовать снова
            </Button>
            <Button asChild variant="secondary">
              <Link href="/traveler/requests">К моим запросам</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/traveler">В кабинет</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

