import {
  BadgeCheck,
  ContactRound,
  FileCheck2,
  MailCheck,
  PhoneCall,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicGuideTrustMarkerKey } from "@/data/public-guides/types";

const trustMarkerCatalog: Record<
  PublicGuideTrustMarkerKey,
  { label: string; description: string; Icon: typeof BadgeCheck }
> = {
  emailVerified: {
    label: "Подтверждён email",
    description: "Адрес электронной почты подтверждён.",
    Icon: MailCheck,
  },
  phoneVerified: {
    label: "Подтверждён телефон",
    description: "Номер телефона подтверждён.",
    Icon: PhoneCall,
  },
  identityVerified: {
    label: "Проверена личность",
    description: "Документы гида проверены.",
    Icon: BadgeCheck,
  },
  backgroundCheck: {
    label: "Дополнительная проверка",
    description: "Проведена расширенная проверка надёжности.",
    Icon: FileCheck2,
  },
  references: {
    label: "Рекомендации",
    description: "Есть внешние рекомендации и отзывы.",
    Icon: ContactRound,
  },
};

export function PublicGuideTrustMarkers({
  trustMarkers,
}: {
  trustMarkers: Record<PublicGuideTrustMarkerKey, boolean>;
}) {
  const keys = Object.keys(trustMarkers) as PublicGuideTrustMarkerKey[];
  const enabled = keys.filter((key) => trustMarkers[key]);

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Маркер доверия</span>
          <Badge variant={enabled.length >= 3 ? "secondary" : "outline"}>
            {enabled.length}/{keys.length} активно
          </Badge>
        </CardTitle>
        <CardDescription>
          Подтверждения и сигналы, которые помогают путешественникам оценить гида.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {keys.map((key) => {
          const item = trustMarkerCatalog[key];
          const Icon = item.Icon;
          const isEnabled = trustMarkers[key];

          return (
            <div
              key={key}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={[
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl",
                    isEnabled
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <Badge variant={isEnabled ? "secondary" : "outline"}>
                {isEnabled ? "Подтверждено" : "Не заполнено"}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

