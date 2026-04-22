import Link from "next/link";

import type { RequestRecord } from "@/data/supabase/queries";

function buildSentence(req: RequestRecord): string {
  const parts: string[] = [req.destination];
  if (req.dateLabel) parts.push(req.dateLabel);
  if (req.budgetRub > 0) {
    const k = Math.floor(req.budgetRub / 1000);
    parts.push(`бюджет ${k} тыс.`);
  }
  return parts.join(", ");
}

interface Props {
  requests: RequestRecord[];
}

export function HomePageDiscovery({ requests }: Props) {
  if (requests.length === 0) return null;

  return (
    <section aria-label="Открытые запросы путешественников" className="bg-surface py-14">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          вот что сейчас обсуждают другие
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="block rounded-lg border border-foreground/[0.12] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="mb-3 font-display text-[1.125rem] leading-snug text-foreground">
                &ldquo;{buildSentence(req)}&rdquo;
              </p>
              <p className="mb-3 text-sm text-muted-foreground">↳ {req.offerCount} ответов гидов</p>
              <p className="text-xs font-semibold text-primary">открыть →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
