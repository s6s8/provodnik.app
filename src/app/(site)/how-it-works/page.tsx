import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Compass,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";

import { ArticleShell } from "@/components/shared/article-shell";
import { StepCard } from "@/components/shared/step-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Как это работает",
};

const REQUEST_STEPS = [
  {
    step: "1",
    icon: Send,
    text: "Укажите город, даты, формат группы (своя или открытая) и желаемый бюджет.",
  },
  {
    step: "2",
    icon: Users,
    text: "Гиды откликнутся с программой и ценой — сравните и выберите.",
  },
  {
    step: "3",
    icon: CheckCircle2,
    text: "Подтвердите бронирование в чате.",
  },
] as const;

const CATALOG_STEPS = [
  {
    step: "1",
    icon: Compass,
    text: "Выберите маршрут из каталога с фиксированной ценой и расписанием.",
  },
  {
    step: "2",
    icon: Calendar,
    text: "Найдите свободное место на удобную дату.",
  },
  {
    step: "3",
    icon: MessageCircle,
    text: "Договоритесь с гидом об оплате напрямую — наличными или переводом.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <ArticleShell>
      <PageHeader
        title="Как это работает"
        subtitle="Два способа найти гида — выберите удобный"
        className="mb-12"
      />

      <section className="mb-12">
        <h2 className="mb-6 text-section font-extrabold tracking-tight text-foreground">
          Запрос гидам
        </h2>
        <div className="space-y-3">
          {REQUEST_STEPS.map((item) => (
            <StepCard key={item.step} step={item.step} icon={item.icon}>
              {item.text}
            </StepCard>
          ))}
        </div>
        <div className="mt-6">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">Создать запрос</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-section font-extrabold tracking-tight text-foreground">
          Готовые экскурсии
        </h2>
        <div className="space-y-3">
          {CATALOG_STEPS.map((item) => (
            <StepCard key={item.step} step={item.step} icon={item.icon}>
              {item.text}
            </StepCard>
          ))}
        </div>
        <div className="mt-6">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/listings">Смотреть экскурсии</Link>
          </Button>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border/50 pt-8">
        <p className="text-sm text-muted-foreground">Вы гид?</p>
        <Button asChild variant="ghost">
          <Link href="/become-a-guide">
            Стать гидом <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </ArticleShell>
  );
}
