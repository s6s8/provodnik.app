"use client";

import * as React from "react";

import { Camera, Mountain, ShipWheel, Utensils } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LayoutGrid, type LayoutGridCard } from "@/components/ui/layout-grid";

const cards: LayoutGridCard[] = [
  {
    id: 1,
    className: "md:col-span-2 h-[18rem] md:h-[24rem]",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80",
    content: <RostovContent />,
  },
  {
    id: 2,
    className: "col-span-1 h-[18rem] md:h-[24rem]",
    thumbnail:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&h=1400&q=80",
    content: <BaikalContent />,
  },
  {
    id: 3,
    className: "col-span-1 h-[18rem] md:h-[24rem]",
    thumbnail:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&h=1400&q=80",
    content: <KazanContent />,
  },
  {
    id: 4,
    className: "md:col-span-2 h-[18rem] md:h-[24rem]",
    thumbnail:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&h=1200&q=80",
    content: <AltaiContent />,
  },
];

export function LayoutGridShowcase() {
  return (
    <section className="section-frame rounded-[2.4rem] p-5 sm:p-8">
      <div className="mb-6 max-w-3xl space-y-3">
        <p className="editorial-kicker">Подборки и вдохновение</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Откройте карточку и посмотрите, как может выглядеть следующий маршрут
        </h2>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          Ниже не просто баннеры. Это интерактивные подборки направлений: еда,
          природа, фото-поездки и короткие городские выезды, которые помогают выбрать
          настроение поездки до перехода в каталог.
        </p>
      </div>

      <LayoutGrid cards={cards} />
    </section>
  );
}

function ContentBlock({
  icon,
  title,
  description,
  stats,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: readonly string[];
}) {
  return (
    <div className="space-y-4 text-white">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
        {icon}
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-semibold tracking-tight sm:text-4xl">{title}</p>
        <p className="max-w-xl text-sm leading-7 text-neutral-200 sm:text-base">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {stats.map((item) => (
          <Badge
            key={item}
            className="border-white/0 bg-white/16 px-3 py-1 text-white hover:bg-white/16"
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function RostovContent() {
  return (
    <ContentBlock
      icon={<Utensils className="size-5" />}
      title="Юг России и гастро-маршруты"
      description="Рынки, дворики, дегустации и короткие выезды к воде. Хороший сценарий для первого знакомства с Provodnik."
      stats={["Ростов-на-Дону", "1 день", "до 6 человек"]}
    />
  );
}

function BaikalContent() {
  return (
    <ContentBlock
      icon={<Mountain className="size-5" />}
      title="Байкал зимой"
      description="Ледовые маршруты, безопасный темп, фото-остановки и понятный план дня для маленькой группы."
      stats={["Природа", "зима", "спокойный темп"]}
    />
  );
}

function KazanContent() {
  return (
    <ContentBlock
      icon={<Camera className="size-5" />}
      title="Городские выходные"
      description="Казань, вечерний свет, еда, история и прогулка, которая не превращается в длинную лекцию."
      stats={["Казань", "еда и история", "для пары"]}
    />
  );
}

function AltaiContent() {
  return (
    <ContentBlock
      icon={<ShipWheel className="size-5" />}
      title="Поездки на природу"
      description="Алтай, Карелия и другие маршруты, где важны ритм, погода, паузы для фото и честные ожидания по логистике."
      stats={["Алтай", "фото-паузы", "маршрут на день"]}
    />
  );
}
