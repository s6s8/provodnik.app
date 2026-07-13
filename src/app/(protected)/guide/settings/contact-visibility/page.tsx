import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Circle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ContactVisibilityChip } from "@/components/guide/ContactVisibilityChip";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Видимость контактов",
};

export default async function ContactVisibilitySettingsPage() {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/guide/settings/contact-visibility");
  }

  if (auth.role && auth.role !== "guide") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  let unlocked = false;
  let averageRating: number | null = null;
  let responseRate: number | null = null;
  let loadError = false;

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
    loadError = true;
  }

  const ratingMet = (averageRating ?? 0) >= 4.0;
  const responseMet = (responseRate ?? 0) >= 0.6;

  const ratingLabel =
    averageRating != null ? averageRating.toFixed(1) : "–";
  const responsePct = Math.round((responseRate ?? 0) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-8 py-8">
      <PageHeader eyebrow="Кабинет гида" title="Видимость контактов" />

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить данные. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      )}

      <ContactVisibilityChip
        unlocked={unlocked}
        averageRating={averageRating}
        responseRate={responseRate}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Как это работает
        </h2>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-2">
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

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Ваш прогресс</h2>
        <ul className="flex flex-col gap-4">
          <li className="flex gap-3 rounded-card border border-border bg-surface-high p-4">
            {ratingMet ? (
              <Check
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-success"
              />
            ) : (
              <Circle
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
            )}
            <div className="min-w-0 flex flex-col gap-1">
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
              <Circle
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
            )}
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Ответы</p>
              <p className="text-sm text-ink-2">
                {responsePct}% / 60%
              </p>
            </div>
          </li>
        </ul>

        {!unlocked && (
          <Button asChild>
            <Link href="/guide/listings">Перейти к объявлениям</Link>
          </Button>
        )}
      </section>

      <p className="text-sm text-ink-3">
        Порог обновляется автоматически после каждого бронирования и отзыва
      </p>
    </div>
  );
}
