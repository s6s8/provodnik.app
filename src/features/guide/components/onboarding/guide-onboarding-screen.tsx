import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { GuideOnboardingForm } from "@/features/guide/components/onboarding/guide-onboarding-form";
import type { AuthContext } from "@/lib/auth/types";

type GuideOnboardingScreenProps = {
  auth: AuthContext;
};

export function GuideOnboardingScreen({ auth }: GuideOnboardingScreenProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет гида</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Старт гида и проверка данных
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Заполните базовый профиль и данные для проверки. Если вы вошли через
            Supabase, анкета сохранится в вашем профиле гида; без настроенного
            Supabase она хранится только локально в этом браузере.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/requests">Входящие запросы</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/bookings">Бронирования</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Мои программы</Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Анкета гида</CardTitle>
          <p className="text-sm text-muted-foreground">
            Заполните минимум сейчас — позже это станет основой для верификации,
            листингов и выплат.
          </p>
        </CardHeader>
        <CardContent>
          <GuideOnboardingForm auth={auth} />
        </CardContent>
      </Card>
    </div>
  );
}

