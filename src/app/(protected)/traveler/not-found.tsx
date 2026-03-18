import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Страница не найдена</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Возможно, ссылка устарела или объект был удалён.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/traveler/requests">К моим запросам</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/traveler/open-requests">Открытые группы</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

