import { RequestCardFinal } from "@/components/shared/request-card-final";
import type { RequestRecord } from "@/data/supabase/queries";

function formatPrice(budgetRub: number): string {
  if (!budgetRub) return "По договоренности";
  return `${new Intl.NumberFormat("ru-RU").format(budgetRub)} ₽ / чел`;
}

function deriveGuideState(status: RequestRecord["status"]) {
  return status === "booked" ? "found" : "waiting";
}

interface Props {
  requests: RequestRecord[];
}

export function HomePageDiscovery({ requests }: Props) {
  return (
    <section aria-label="Открытые запросы путешественников" className="bg-surface pt-12 pb-24 xl:pb-40">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Что ищут путешественники прямо сейчас
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {requests.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-foreground/[0.12] bg-white p-4 md:px-6 md:py-5 shadow-sm md:col-span-2 text-center">
              <p className="font-display text-[1.125rem] font-semibold leading-snug text-foreground">
                Пока пусто
              </p>
              <p className="text-sm text-muted-foreground">
                Будьте первыми — отправьте запрос в форме выше
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <RequestCardFinal
                key={req.id}
                href={`/requests/${req.id}`}
                location={req.destination}
                date={req.dateLabel}
                groupType={req.mode}
                guideState={deriveGuideState(req.status)}
                datesFlexible={req.date_locked === false}
                interests={req.interests}
                members={req.members}
                price={formatPrice(req.budgetRub)}
              />
            ))
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
