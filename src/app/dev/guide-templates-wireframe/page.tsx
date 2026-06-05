import { Check, ChevronRight, MoreHorizontal, X as XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const routeTemplates = [
  {
    title: "Тбилиси за один день",
    duration: "6 часов",
    status: "В каталоге",
    statusVariant: "outline",
  },
  {
    title: "Кахетия: вино и горы",
    duration: "8 часов",
    status: "В каталоге",
    statusVariant: "outline",
  },
  {
    title: "Казбеги — ущелье Трусо",
    duration: "Весь день",
    status: "Скрыт",
    statusVariant: "secondary",
  },
] satisfies {
  title: string;
  duration: string;
  status: string;
  statusVariant: "outline" | "secondary";
}[];

const portfolioPhotos = ["Старый Тбилиси", "Нарикала", "Мцхета"];

function WireframeSection({
  id,
  title,
  children,
  contentClassName = "mx-auto w-full max-w-sm",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function TemplateCard({
  title,
  duration,
  status,
  statusVariant,
}: (typeof routeTemplates)[number]) {
  return (
    <article className="rounded-card border border-border bg-card p-3 shadow-sm">
      <div className="aspect-video rounded-md bg-muted" />
      <div className="mt-3 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{duration}</p>
        </div>
        <Badge variant={statusVariant}>{status}</Badge>
        <div className="flex justify-end gap-1 pt-1">
          <Button variant="ghost" size="icon-xs" aria-label={`Действия шаблона ${title}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label={`Настройки шаблона ${title}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label={`Еще действия шаблона ${title}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function GuideTemplateListScreen() {
  return (
    <div className="rounded-card bg-surface-high p-4 shadow-card">
      <h1 className="text-2xl font-semibold text-foreground">Портфолио</h1>

      <Tabs defaultValue="templates" className="mt-5">
        <TabsList>
          <TabsTrigger value="photos">Фото</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
        </TabsList>
        <TabsContent value="photos">
          <p className="rounded-card border border-border bg-card p-4 text-sm text-muted-foreground">
            Здесь будут фото
          </p>
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          <Button variant="outline" className="w-full">
            + Новый шаблон
          </Button>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {routeTemplates.map((template) => (
              <TemplateCard key={template.title} {...template} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="reviews">
          <p className="rounded-card border border-border bg-card p-4 text-sm text-muted-foreground">
            Здесь будут отзывы
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuideTemplateFormScreen() {
  return (
    <div className="rounded-card bg-surface-high p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Новый шаблон</h3>
        <Button variant="ghost" size="icon-sm" aria-label="Закрыть форму">
          <XIcon aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="route-title">
            Название маршрута <span className="text-destructive">*</span>
          </Label>
          <Input id="route-title" placeholder="Например: Тбилиси за один день" />
        </div>

        <div className="space-y-2">
          <Label>Фото</Label>
          <div className="flex min-h-[80px] items-center justify-center rounded-[1.2rem] border border-dashed border-border bg-muted px-4 text-center text-sm text-muted-foreground">
            Выберите из портфолио или загрузите
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-description">Описание</Label>
          <Textarea id="route-description" placeholder="Что ждёт путешественника…" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-duration">Длительность</Label>
          <Input id="route-duration" placeholder="Например: 6 часов" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-price">Цена от</Label>
          <Input id="route-price" placeholder="Оставьте пустым — договоритесь на месте" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-capacity">Вместимость</Label>
          <Input id="route-capacity" placeholder="Максимум человек" />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-border bg-card p-3">
          <span className="text-sm font-medium text-foreground">Показывать в каталоге</span>
          <div className="flex h-5 w-10 items-center justify-end rounded-full bg-primary p-0.5" aria-hidden="true">
            <div className="size-4 rounded-full bg-primary-foreground shadow-sm" />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="ghost">Отмена</Button>
        <Button>Сохранить</Button>
      </div>
    </div>
  );
}

function TemplatePickerScreen() {
  return (
    <div className="space-y-3">
      <div className="rounded-card bg-surface-high p-4 shadow-card">
        <h3 className="text-lg font-semibold text-foreground">Ваш отклик</h3>
        <Textarea className="mt-4 bg-muted" placeholder="Опишите маршрут…" readOnly />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm">
            Из шаблона ↑
          </Button>
          <Button size="sm">Отправить отклик</Button>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface-high p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Добавить в отклик</h3>
          <Button variant="ghost" size="icon-sm" aria-label="Закрыть picker">
            <XIcon aria-hidden="true" />
          </Button>
        </div>

        <Tabs defaultValue="templates" className="mt-4">
          <TabsList>
            <TabsTrigger value="templates">Шаблоны</TabsTrigger>
            <TabsTrigger value="photos">Фото</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="space-y-2">
            {routeTemplates.map((template) => (
              <button
                key={template.title}
                className="flex w-full items-center gap-3 rounded-[1.2rem] border border-border bg-card p-2 text-left transition-colors hover:bg-muted"
                type="button"
              >
                <span className="size-14 shrink-0 rounded-md bg-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{template.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{template.duration}</span>
                </span>
                <ChevronRight className="text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </TabsContent>
          <TabsContent value="photos" forceMount className="!block">
            <PhotoPickerPreview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BidResponseCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-card bg-surface-high p-4 shadow-card ${className}`}>
      <h3 className="text-lg font-semibold text-foreground">Ваш отклик</h3>
      <Textarea className="mt-4 bg-muted" placeholder="Опишите маршрут…" readOnly />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm">
          Из шаблона ↑
        </Button>
        <Button size="sm">Отправить отклик</Button>
      </div>
    </div>
  );
}

function TemplatePickerRows() {
  return (
    <div className="space-y-2">
      {routeTemplates.map((template) => (
        <button
          key={template.title}
          className="flex w-full items-center gap-3 rounded-[1.2rem] border border-border bg-card p-2 text-left transition-colors hover:bg-muted"
          type="button"
        >
          <span className="size-14 shrink-0 rounded-md bg-muted" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{template.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{template.duration}</span>
          </span>
          <ChevronRight className="text-muted-foreground" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function TemplatePickerCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-card border border-border bg-surface-high p-4 shadow-card ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Добавить в отклик</h3>
        <Button variant="ghost" size="icon-sm" aria-label="Закрыть picker">
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-4">
        <TemplatePickerRows />
      </div>
    </div>
  );
}

function PickerComparisonScreen() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-card border border-border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Вариант A — блок снизу</h3>
          <p className="mt-1 text-xs text-muted-foreground">Скролл вниз для выбора шаблона</p>
        </div>
        <BidResponseCard />
        <p className="text-center text-xs text-muted-foreground">↓ Пикер появляется ниже, нужно скроллить</p>
        <TemplatePickerCard />
      </div>

      <div className="space-y-3 rounded-card border border-border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Вариант B — шит поверх</h3>
          <p className="mt-1 text-xs text-muted-foreground">Шит всплывает поверх формы, не требует скролла</p>
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-card bg-muted/40">
          <BidResponseCard className="pointer-events-none opacity-40" />
          <div className="absolute inset-x-0 bottom-0 h-[280px] rounded-t-[1.5rem] bg-surface-high p-4 shadow-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">Добавить в отклик</h3>
              <Button variant="ghost" size="icon-sm" aria-label="Закрыть picker">
                <XIcon aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-4">
              <TemplatePickerRows />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoPickerPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {portfolioPhotos.map((photo, index) => (
          <div key={photo} className="space-y-1">
            <div className="relative aspect-square w-full rounded-md bg-muted">
              {index < 2 ? (
                <span className="absolute inset-1 flex items-center justify-center rounded-md bg-primary/80 text-primary-foreground">
                  <Check aria-hidden="true" />
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">{photo}</p>
          </div>
        ))}
      </div>
      <Button className="w-full" size="sm">
        Добавить выбранные (2)
      </Button>
    </div>
  );
}

export default function GuideTemplatesWireframePage() {
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Шаблоны маршрутов гида — wireframe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Статичный прототип без авторизации, БД и реальных действий для согласования UX.
        </p>
      </div>

      <div className="space-y-10">
        <WireframeSection id="screen-template-list" title="Экран 1: Список шаблонов">
          <GuideTemplateListScreen />
        </WireframeSection>

        <WireframeSection id="screen-template-create" title="Экран 2: Создание шаблона">
          <GuideTemplateFormScreen />
        </WireframeSection>

        <WireframeSection id="screen-bid-picker" title="Экран 3: Picker в отклике">
          <TemplatePickerScreen />
        </WireframeSection>

        <WireframeSection
          id="screen-bid-picker-comparison"
          title="Экран 3: Сравнение вариантов"
          contentClassName="w-full"
        >
          <PickerComparisonScreen />
        </WireframeSection>
      </div>
    </main>
  );
}
