import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getRequestById,
  getSimilarRequests,
} from "@/data/supabase/queries";
import { SentScreenEnrich } from "@/features/requests/components/sent-screen-enrich";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Запрос отправлен" };

export default async function SentPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: request } = await getRequestById(supabase, requestId);
  if (!request) redirect("/traveler/requests");

  const { data: ownership } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!ownership || ownership.traveler_id !== user.id) redirect("/traveler/requests");

  const { data: similar } = await getSimilarRequests(
    supabase,
    request.destinationSlug,
    requestId,
  );

  const sentenceParts: string[] = [`в ${request.destination}`];
  if (request.dateLabel) sentenceParts.push(`на ${request.dateLabel}`);

  return (
    <div className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)] py-16">
      {/* Zone 1 — The moment */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <span className="inline-block size-3 animate-pulse rounded-full bg-primary" />
        </div>
        <h1 className="mb-2 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-foreground">
          Запрос отправлен!
        </h1>
        <p className="text-base text-muted-foreground">
          Гиды получат уведомление и начнут предлагать варианты
        </p>
        <div className="mt-6 rounded-xl border border-border bg-muted/30 px-6 py-5">
          <p className="font-display text-2xl leading-snug text-foreground">
            &ldquo;Хочу {sentenceParts.join(" ")}&rdquo;
          </p>
        </div>
      </div>

      {/* Zone 2 — Enrich */}
      <div className="mb-10">
        <SentScreenEnrich requestId={requestId} />
      </div>

      {/* Zone 3 — What happens next */}
      <div className="mb-10 rounded-xl border border-border bg-muted/10 p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Что дальше?
        </p>
        <ol className="space-y-3">
          {[
            "Гиды видят ваш запрос прямо сейчас",
            "Каждый предложит программу и цену — обычно за 2–24 часа",
            "Вы выбираете лучшее предложение и подтверждаете поездку",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Zone 4 — Similar requests */}
      {similar && similar.length > 0 && (
        <div className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Или присоединитесь к похожей поездке
          </p>
          <div className="space-y-3">
            {similar.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="block rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <p className="mb-1 font-display text-base text-foreground">
                  &ldquo;{req.destination}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">↳ {req.offerCount} ответов гидов</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Zone 5 — CTAs */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/traveler/requests/${requestId}`}>
            Смотреть входящие предложения
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/traveler/requests">К моим запросам</Link>
        </Button>
      </div>
    </div>
  );
}
