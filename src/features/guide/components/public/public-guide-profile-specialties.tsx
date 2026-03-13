import { Compass, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicGuideProfile } from "@/data/public-guides/types";

export function PublicGuideProfileSpecialties({
  guide,
}: {
  guide: PublicGuideProfile;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          Специализация
        </CardTitle>
        <CardDescription>
          В чём этот гид чувствует себя уверенно и какие форматы ведёт чаще всего.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {guide.specialties.map((item) => (
            <Badge key={item} variant="secondary" className="rounded-full">
              {item}
            </Badge>
          ))}
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ListChecks className="size-4 text-primary" />
            Дополнительно об опыте
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Позже здесь появятся стандартные детали: привычный размер группы, базовые ожидания по транспорту и особенности доступности.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

