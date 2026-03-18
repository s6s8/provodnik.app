 "use client";

import { MapPinned } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TravelerRequestCreateForm } from "@/features/traveler/components/request-create/traveler-request-create-form";

export function PublicRequestCreateScreen() {
  return (
    <div className="space-y-8">
      <section className="section-frame overflow-hidden rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <MapPinned className="size-4 text-primary" />
              Новый публичный запрос
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Создайте запрос, с которого начнётся ваша поездка.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Опишите направление, даты и бюджет — на основе этого запроса можно
              собрать группу, найти гида и показать поездку на доске запросов.
              Сейчас запрос хранится локально на этом устройстве.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Публичный вход в маркетплейс
              </Badge>
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                На основе реального запроса
              </Badge>
            </div>
          </div>

          <Card className="border-border/70 bg-card/92">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">
                Как работает публичный запрос
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                1. Вы заполняете форму и сохраняете запрос. Он появляется в вашем
                локальном кабинете путешественника.
              </p>
              <p>
                2. На основе запроса можно сформировать публичную карточку на
                доске запросов и открыть набор в группу.
              </p>
              <p>
                3. В будущем сюда добавится связка с откликами гидов и
                подтверждёнными поездками.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Параметры вашего запроса</CardTitle>
          </CardHeader>
          <CardContent>
            <TravelerRequestCreateForm redirectToOnSuccess="/requests" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

