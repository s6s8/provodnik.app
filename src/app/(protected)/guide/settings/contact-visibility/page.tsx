import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";

import { ContactVisibilityChip } from "@/components/guide/ContactVisibilityChip";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Видимость контактов",
};

export default async function ContactVisibilitySettingsPage() {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/settings/contact-visibility");
  }

  if (auth.role && auth.role !== "guide") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  let unlocked = false;
  let averageRating: number | null = null;
  let responseRate: number | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("guide_profiles")
        .select("contact_visibility_unlocked, average_rating, response_rate")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        unlocked = profile.contact_visibility_unlocked === true;
        averageRating =
          profile.average_rating != null
            ? Number(profile.average_rating)
            : null;
        responseRate =
          profile.response_rate != null ? Number(profile.response_rate) : null;
      }
    }
  } catch {
    // Supabase unavailable — show locked state with empty metrics
  }

  const ratingMet = (averageRating ?? 0) >= 4.0;
  const responseMet = (responseRate ?? 0) >= 0.6;

  const ratingLabel =
    averageRating != null ? averageRating.toFixed(1) : "–";
  const responsePct = Math.round((responseRate ?? 0) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-8">
      <h1 className="font-display text-2xl text-foreground md:text-3xl">
        Видимость контактов
      </h1>

      <ContactVisibilityChip
        unlocked={unlocked}
        averageRating={averageRating}
        responseRate={responseRate}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Как это работает
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-ink-2">
          <p>
            Когда ваш средний рейтинг не ниже 4,0 из 5,0 и доля ответов на
            запросы не ниже 60%, путешественники видят ваши телефон, email и
            Telegram в профиле и после бронирования.
          </p>
          <p>
            Пока условия не выполнены, контакты скрыты: путешественники могут
            связаться с вами только через сообщения на платформе.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Ваш прогресс</h2>
        <ul className="space-y-4">
          <li className="flex gap-3 rounded-card border border-border bg-surface-high p-4">
            {ratingMet ? (
              <Check
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-success"
              />
            ) : (
              <X
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-destructive"
              />
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">Рейтинг</p>
              <p className="text-sm text-ink-2">
                {ratingLabel} / 4.0
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-card border border-border bg-surface-high p-4">
            {responseMet ? (
              <Check
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-success"
              />
            ) : (
              <X
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-destructive"
              />
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">Ответы</p>
              <p className="text-sm text-ink-2">
                {responsePct}% / 60%
              </p>
            </div>
          </li>
        </ul>
      </section>

      <p className="text-sm text-ink-3">
        Порог обновляется автоматически после каждого бронирования и отзыва
      </p>
    </div>
  );
}
