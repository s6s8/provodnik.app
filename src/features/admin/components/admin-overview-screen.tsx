import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  FileSearch,
  Flag,
  ListChecks,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_DISPUTE_CASES } from "@/features/admin/components/disputes/dispute-seed";
import { type GuideApplication } from "@/features/admin/types/guide-review";
import { type ModerationListing } from "@/features/admin/types/listing-moderation";

// Local-only snapshot for the overview. Detailed queues remain the source of truth.
const GUIDE_EXAMPLE_COUNT: number = 3;
const LISTING_EXAMPLE_COUNT: number = 3;

const DISPUTE_COUNTS = (() => {
  let open = 0;
  let needsAction = 0;
  let waiting = 0;
  let resolved = 0;

  for (const item of DEFAULT_DISPUTE_CASES) {
    if (item.disposition === "open") open += 1;
    else if (item.disposition === "needs-action") needsAction += 1;
    else if (item.disposition === "waiting") waiting += 1;
    else resolved += 1;
  }

  return {
    total: DEFAULT_DISPUTE_CASES.length,
    open,
    needsAction,
    waiting,
    resolved,
  };
})();

type AdminOverviewSnapshotProps = {
  guideApplicationsSample?: readonly GuideApplication[];
  listingsSample?: readonly ModerationListing[];
};

export function AdminOverviewScreen({
  guideApplicationsSample,
  listingsSample,
}: AdminOverviewSnapshotProps) {
  const guideCount = guideApplicationsSample?.length ?? GUIDE_EXAMPLE_COUNT;
  const listingCount = listingsSample?.length ?? LISTING_EXAMPLE_COUNT;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Админ‑панель</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Обзор доверия и модерации
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Рабочая точка входа для оператора: верификация гидов, модерация
                объявлений и споры по бронированиям. Всё строится вокруг связки
                запрос → предложение → бронь → спор/возврат.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/admin">
                <ListChecks className="mr-1 size-4" />
                Обзор
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/guides">
                <ClipboardList className="mr-1 size-4" />
                Проверка гидов
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/listings">
                <FileSearch className="mr-1 size-4" />
                Объявления
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/disputes">
                <Flag className="mr-1 size-4" />
                Споры и возвраты
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Как связаны сущности</CardTitle>
              <CardDescription>
                Одна заявка путешественника создаёт запрос. Гид отдаёт одно или
                несколько предложений. После согласования возникает бронь, а
                спор/возврат подвязывается к конкретной брони и политике.
              </CardDescription>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Запросы</div>
              <p className="text-sm text-muted-foreground">
                Путешественник формулирует задачу (даты, город, формат). На
                этом этапе риски — качество описания и спам.
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Предложения и объявления</div>
              <p className="text-sm text-muted-foreground">
                Гиды отвечают объявлениями и индивидуальными предложениями. Здесь
                фокус модерации: риск‑сигналы, соответствие политикам, честные
                описания.
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Бронирования и споры</div>
              <p className="text-sm text-muted-foreground">
                Каждое бронирование может привести к спору. Спор всегда несёт
                ссылку на бронь, политику и состояние выплат, чтобы решения были
                аудируемыми.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Проверка гидов</CardTitle>
              <Badge variant="outline">{guideCount} в демо‑очереди</Badge>
            </div>
            <CardDescription>
              Верификация личность → документы → сигналы доверия, прежде чем
              гид появится в выдаче.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Сводка по документам и проверкам благонадёжности.</li>
              <li>Решения фиксируются с комментарием для аудита.</li>
              <li>Сигналы доверия видны в публичном профиле гида.</li>
            </ul>
          </CardContent>
          <CardContent className="pt-0">
            <Button asChild type="button" variant="secondary" className="w-full">
              <Link href="/admin/guides">
                <ClipboardList className="mr-1 size-4" />
                Открыть очередь проверки гидов
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Модерация объявлений</CardTitle>
              <Badge variant="outline">{listingCount} в демо‑очереди</Badge>
            </div>
            <CardDescription>
              Управление видимостью предложений и реагирование на риск‑сигналы
              по контенту и географии.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Флаги цены, спама, гео‑несовпадений и риск‑медиа.</li>
              <li>Решения: опубликовать, запросить правки, скрыть или заблокировать.</li>
              <li>Каждое действие сопровождается комментарием оператора.</li>
            </ul>
          </CardContent>
          <CardContent className="pt-0">
            <Button asChild type="button" variant="secondary" className="w-full">
              <Link href="/admin/listings">
                <FileSearch className="mr-1 size-4" />
                Открыть модерацию объявлений
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Споры и возвраты</CardTitle>
              <Badge variant="outline">
                {DISPUTE_COUNTS.total} споров · {DISPUTE_COUNTS.needsAction}{" "}
                требует действий
              </Badge>
            </div>
            <CardDescription>
              Очередь и карточки споров вокруг конкретной брони и политики
              отмены/возвратов.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Фиксация позы блокировки выплат и всех шагов по политике.
              </li>
              <li>Хронология сообщений, доказательств и внутренних заметок.</li>
              <li>
                Черновик решения по возврату/кредиту без исполнения платежа.
              </li>
            </ul>
          </CardContent>
          <CardContent className="pt-0">
            <Button asChild type="button" variant="secondary" className="w-full">
              <Link href="/admin/disputes">
                <AlertTriangle className="mr-1 size-4" />
                Открыть очередь споров
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

