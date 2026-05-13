import Link from "next/link";

import type { RequestRecord } from "@/data/supabase/queries";
import { INTEREST_CHIPS } from "@/data/interests";
import { formatGroupLine } from "@/data/requests-format";

function formatOfferCount(count: number): string {
  if (count === 0) return "Нет ответов ещё";
  if (count === 1) return "1 ответ";
  if (count >= 2 && count <= 4) return `${count} ответа`;
  return `${count} ответов`;
}

const interestLabelMap: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map((c) => [c.id, c.label]),
);

function resolveInterestLabels(slugs: string[]): string[] {
  return slugs.flatMap((s) => (interestLabelMap[s] ? [interestLabelMap[s]] : []));
}

interface Props {
  requests: RequestRecord[];
}

export function HomePageDiscovery({ requests }: Props) {
  return (
    <section aria-label="Открытые запросы путешественников" className="bg-surface pt-12 pb-16 xl:pb-24">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Запросы путешественников
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {requests.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-foreground/[0.12] bg-white p-4 md:px-6 md:py-5 shadow-sm md:col-span-2 text-center">
              <p className="font-display text-[1.125rem] font-semibold leading-snug text-foreground">
                Здесь появляются запросы путешественников
              </p>
              <p className="text-sm text-muted-foreground">
                Будьте первыми — отправьте запрос в форме выше
              </p>
            </div>
          ) : (
            requests.map((req) => {
              const interestLabels = resolveInterestLabels(req.interests);
              const visibleLabels = interestLabels.slice(0, 4);
              const overflow = interestLabels.length - visibleLabels.length;
              const interestText =
                visibleLabels.length > 0
                  ? visibleLabels.join(" · ") + (overflow > 0 ? ` +${overflow}` : "")
                  : null;

              return (
                <Link
                  key={req.id}
                  href={`/requests/${req.id}`}
                  className="flex h-full flex-col gap-3 rounded-lg border border-foreground/[0.12] bg-white p-4 md:px-6 md:py-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="font-display text-[1.125rem] font-semibold leading-snug text-foreground">
                    {req.destination}{req.dateLabel ? ` · ${req.dateLabel}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatGroupLine(req)}</p>
                  <p className="text-sm text-muted-foreground">{interestText ?? " "}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.budgetRub.toLocaleString("ru-RU")} ₽/чел. · {formatOfferCount(req.offerCount)}
                  </p>
                  <p className="text-xs font-semibold text-primary">открыть →</p>
                </Link>
              );
            })
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
