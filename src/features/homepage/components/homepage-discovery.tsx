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
  if (requests.length === 0) return null;

  // Vertical-gap balance: hero py-16 + discovery pt-12 = 7rem above; discovery pb-14 + footer pt-14 = 7rem below. Keep token sums in sync if any padding changes.
  return (
    <section aria-label="Открытые запросы путешественников" className="bg-surface pt-12 pb-14">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Запросы путешественников
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((req) => {
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
                className="flex h-full flex-col rounded-lg border border-foreground/[0.12] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="mb-1 font-display text-[1.125rem] font-semibold leading-snug text-foreground">
                  {req.destination}{req.dateLabel ? ` · ${req.dateLabel}` : ""}
                </p>
                <p className="mb-1 text-sm text-muted-foreground">{formatGroupLine(req)}</p>
                <p className="mb-1 text-sm text-muted-foreground">{interestText ?? " "}</p>
                <p className="mb-3 text-sm text-muted-foreground">
                  {req.budgetRub.toLocaleString("ru-RU")} ₽/чел. · {formatOfferCount(req.offerCount)}
                </p>
                <p className="text-xs font-semibold text-primary">открыть →</p>
              </Link>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
