import type { Metadata } from "next";
import Link from "next/link";

import { ArticleShell } from "@/components/shared/article-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Для бизнеса и корпоративных групп",
    description:
      "Корпоративные экскурсии и тимбилдинг через Provodnik: что доступно сейчас, как оформить безналичную оплату, договор с юрлицом, счёт, акт и закрывающие документы.",
  };
}

const SUPPORTED_NOW = [
  "Групповые экскурсии до 20 человек — подходит для корпоратива, тимбилдинга, выездных мероприятий и команд.",
  "Запрос с указанием состава группы, бюджета и пожеланий — гиды откликаются с программой и ценой.",
  "Письменная фиксация программы, маршрута, даты и стоимости в чате с гидом — переписка остаётся доступной обеим сторонам.",
] as const;

const NOT_SUPPORTED_YET = [
  "Автоматическое выставление счёта на юрлицо из личного кабинета.",
  "Договор оказания услуг между юрлицом-заказчиком и платформой.",
  "Безналичная оплата с расчётного счёта компании напрямую через Provodnik.",
  "Автоматическая выгрузка закрывающих документов: акта оказанных услуг, УПД, счёт-фактуры.",
] as const;

const HOW_TO_PROCEED = [
  "Напишите на support@provodnik.app с темой «Корпоративная заявка»: укажите город, даты, число участников, бюджет и какие документы нужны вашей бухгалтерии (счёт, договор, акт, УПД).",
  "Мы свяжем вас с гидом или партнёром, который оформляет услуги как ИП или юрлицо и выставляет необходимые закрывающие документы напрямую.",
  "Дальнейшие расчёты — безналичный перевод от вашего юрлица напрямую гиду или партнёру по реквизитам в счёте.",
] as const;

export default function ForBusinessPage() {
  return (
    <ArticleShell>
      <div className="space-y-10">
        <div>
          <PageHeader
            eyebrow="Для бизнеса"
            title="Корпоративные экскурсии и работа с юрлицами"
            className="mb-10"
          />
          <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.5] text-on-surface-muted">
            Если вы организуете корпоратив, тимбилдинг или выездное
            мероприятие и вашей бухгалтерии нужны счёт, договор, акт или
            иные закрывающие документы — прочитайте, что Provodnik умеет
            сейчас и как мы помогаем оформить поездку для юрлица.
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              Что доступно прямо сейчас
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              {SUPPORTED_NOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              Чего ещё нет (но скоро будет)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Provodnik сейчас работает как маркетплейс для физлиц: оплата
              идёт напрямую гиду наличными или переводом. На текущем этапе
              платформа не оформляет автоматически:
            </p>
            <ul className="grid gap-2">
              {NOT_SUPPORTED_YET.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Эти возможности — в роадмапе для следующих фаз. Если для вашей
              бухгалтерии они критичны, мы решаем вопрос индивидуально через
              поддержку.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              Как оформить корпоративную поездку
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="grid gap-2 list-decimal pl-5">
              {HOW_TO_PROCEED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Контакт для бизнеса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              По корпоративным заявкам, безналичной оплате, договорам с
              юрлицом и закрывающим документам пишите на{" "}
              <a
                href="mailto:support@provodnik.app?subject=Корпоративная%20заявка"
                className="underline underline-offset-4"
              >
                support@provodnik.app
              </a>
              . Ответим в течение рабочего дня.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 mt-10">
          <Button asChild size="lg">
            <a href="mailto:support@provodnik.app?subject=Корпоративная%20заявка">
              Отправить корпоративный запрос
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Создать запрос</Link>
          </Button>
        </div>
      </div>
    </ArticleShell>
  );
}
