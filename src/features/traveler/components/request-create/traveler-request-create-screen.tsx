import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TravelerRequestCreateForm } from "@/features/traveler/components/request-create/traveler-request-create-form";

export function TravelerRequestCreateScreen() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Новый запрос на поездку
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Опишите, куда и как вы хотите поехать, чтобы гиды могли предложить
            понятные программы с понятным бюджетом. Сейчас запросы хранятся
            локально на этом устройстве.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Основные параметры поездки</CardTitle>
          <p className="text-sm text-muted-foreground">
            Укажите базовые даты, формат и бюджет — этого достаточно, чтобы
            получить первые отклики.
          </p>
        </CardHeader>
        <CardContent>
          <TravelerRequestCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}

