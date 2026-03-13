"use client";

import * as React from "react";
import Link from "next/link";

import { ArrowRight, Camera, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";

import { MasonryGrid } from "@/components/ui/image-testimonial-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stories = [
  {
    name: "Мария",
    city: "Ростов-на-Дону",
    feedback: "Рынок, дворики и южный ритм за один день",
    mainImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&h=1200&q=80",
    height: "h-[28rem]",
  },
  {
    name: "Алексей",
    city: "Байкал",
    feedback: "Ледовые маршруты и спокойный темп для маленькой группы",
    mainImage:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&h=1200&q=80",
    height: "h-[18rem]",
  },
  {
    name: "Ирина",
    city: "Казань",
    feedback: "Городской уикенд: еда, история и вечерний свет",
    mainImage:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&h=1200&q=80",
    height: "h-[22rem]",
  },
  {
    name: "Егор",
    city: "Карелия",
    feedback: "Лес, вода и маршрут без суеты",
    mainImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&h=1200&q=80",
    height: "h-[26rem]",
  },
  {
    name: "Светлана",
    city: "Сочи",
    feedback: "Видовые точки, набережная и спокойный семейный день",
    mainImage:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&h=1200&q=80",
    height: "h-[20rem]",
  },
  {
    name: "Тимур",
    city: "Алтай",
    feedback: "Выезд на природу с фото-остановками и запасом по погоде",
    mainImage:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&h=1200&q=80",
    height: "h-[24rem]",
  },
] as const;

const facts = [
  {
    icon: MapPin,
    title: "Готовые направления",
    description: "Ростов, Азов, Байкал, Карелия, Казань и другие города для старта.",
  },
  {
    icon: Users,
    title: "Форматы под группу",
    description: "Пары, семьи, друзья и маленькие компании без ощущения туристического конвейера.",
  },
  {
    icon: ShieldCheck,
    title: "Честное бронирование",
    description: "Отзывы, условия отмены и профиль гида видны до оформления заявки.",
  },
] as const;

function getColumns(width: number) {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
}

export function HeroSection() {
  const [columns, setColumns] = React.useState(4);

  React.useEffect(() => {
    const handleResize = () => setColumns(getColumns(window.innerWidth));

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
      <div className="space-y-6 xl:sticky xl:top-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Экскурсии, которые хочется сохранить
        </div>

        <div className="space-y-4">
          <h1 className="max-w-xl text-balance text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl">
            Бронируйте впечатления, а не читайте длинные обещания.
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            На главной сразу видно атмосферу маршрутов, географию, формат и подачу
            гида. Provodnik помогает быстро перейти от вдохновения к реальному
            бронированию экскурсии по России.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href="/listings">
              Смотреть каталог
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link href="/traveler">Оставить заявку под даты</Link>
          </Button>
        </div>

        <div className="grid gap-3">
          {facts.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-[1.75rem] border border-border/70 bg-white/78 p-4"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-[2.2rem] border border-white/70 p-4 sm:p-5">
        <MasonryGrid columns={columns} gap={4}>
          {stories.map((story) => (
            <StoryCard key={`${story.city}-${story.name}`} {...story} />
          ))}
        </MasonryGrid>
      </div>
    </section>
  );
}

function StoryCard({
  name,
  city,
  feedback,
  mainImage,
  height,
}: (typeof stories)[number]) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[1.8rem] border border-white/15 shadow-[0_18px_44px_rgba(24,48,61,0.22)] transition-transform duration-300 ease-out hover:-translate-y-1",
        height,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url("${mainImage}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/65" />

      <div className="relative flex h-full flex-col justify-between p-4 text-white sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge className="border-white/0 bg-white/18 text-white hover:bg-white/18">
            {city}
          </Badge>
          <div className="flex size-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-sm font-semibold backdrop-blur">
            {name.slice(0, 1)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Camera className="size-4" />
            <span>{name}</span>
          </div>
          <p className="max-w-xs text-lg font-semibold leading-tight drop-shadow-md sm:text-xl">
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
}
