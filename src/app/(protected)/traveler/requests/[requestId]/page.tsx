import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { mapTravelerRequestRow } from "@/data/traveler-request/map";
import {
  getOrCreateQaThreadAction,
  sendQaMessageAction,
} from "@/features/traveler/actions/qa-actions";
import { OfferCard } from "@/features/traveler/components/requests/offer-card";
import { TravelerRequestDetailScreen } from "@/features/traveler/components/requests/traveler-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOffersForRequest } from "@/lib/supabase/offers";
import type { QaThread } from "@/lib/supabase/qa-threads";
import { getQaMessages } from "@/lib/supabase/qa-threads";
import type {
  GuideOfferRow,
  TravelerRequestRow,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Запрос",
};

const travelerRequestSelect =
  "id, traveler_id, destination, region, interests, starts_on, ends_on, start_time, end_time, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at";


export default async function TravelerRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { requestId } = await params;
  const sp = await searchParams;
  const justCreated = sp.created === "1";
  const createdMode = typeof sp.mode === "string" ? sp.mode : null;

  async function sendQa(threadId: string, body: string) {
    "use server";
    await sendQaMessageAction(threadId, body, requestId);
  }

  async function getOrCreateThread(offerId: string) {
    "use server";
    return getOrCreateQaThreadAction(offerId);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) notFound();

    const { data, error } = await supabase
      .from("traveler_requests")
      .select(travelerRequestSelect)
      .eq("id", requestId)
      .eq("traveler_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) notFound();

    const requestRow = data as TravelerRequestRow;

    let offers: GuideOfferRow[] = [];
    const guideInfoMap = new Map<
      string,
      { guide_id: string; full_name: string | null; avatar_url: string | null }
    >();
    const qaThreadMap = new Map<string, QaThread | null>();

    try {
      offers = await getOffersForRequest(requestId);

      if (offers.length > 0) {
        const guideIds = [...new Set(offers.map((o) => o.guide_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", guideIds);

        for (const p of profiles ?? []) {
          guideInfoMap.set(p.id, {
            guide_id: p.id,
            full_name: p.full_name,
            avatar_url: p.avatar_url ?? null,
          });
        }

        const pendingOfferIds = offers
          .filter((o) => o.status === "pending")
          .map((o) => o.id);

        if (pendingOfferIds.length > 0) {
          const { data: threads } = await supabase
            .from("conversation_threads")
            .select("id, offer_id")
            .in("offer_id", pendingOfferIds)
            .eq("subject_type", "offer");

          for (const offerId of pendingOfferIds) {
            const thread = (threads ?? []).find((t) => t.offer_id === offerId);
            if (thread) {
              try {
                const qaThread = await getQaMessages(thread.id);
                qaThreadMap.set(offerId, qaThread);
              } catch {
                qaThreadMap.set(offerId, null);
              }
            } else {
              qaThreadMap.set(offerId, null);
            }
          }
        }
      }
    } catch {
      // Non-fatal — render page without offers
    }

    return (
      <div className="flex flex-col gap-8">
        {justCreated ? (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {createdMode === "assembly"
              ? "Сборная экскурсия опубликована — гиды увидят ваш запрос и смогут присоединиться."
              : "Запрос отправлен — гиды получат уведомление и ответят в ближайшее время."}
          </div>
        ) : null}
        <TravelerRequestDetailScreen
          record={mapTravelerRequestRow(requestRow)}
        />
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold leading-none text-foreground">
              Предложения гидов
            </h2>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/12 px-1.5 font-sans text-xs font-semibold text-primary">
              {offers.filter((o) => o.status === "pending").length}
            </span>
          </div>

          {offers.filter((o) => o.status === "pending").length === 0 ? (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Пока нет предложений. Гиды увидят ваш запрос и ответят в ближайшее время.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {offers
                .filter((o) => o.status === "pending")
                .map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    guideInfo={guideInfoMap.get(offer.guide_id) ?? null}
                    qaThread={qaThreadMap.get(offer.id) ?? null}
                    requestId={requestId}
                    requestStatus={requestRow.status}
                    onSendQa={sendQa}
                    onGetOrCreateQaThread={getOrCreateThread}
                  />
                ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}

