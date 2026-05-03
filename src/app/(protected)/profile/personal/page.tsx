import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonalSettingsForm } from "@/features/profile/components/PersonalSettingsForm";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideProfileRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Личные настройки",
};

function normalizeLocale(value: string | null | undefined): "ru" | "en" {
  return value === "en" ? "en" : "ru";
}

function normalizeCurrency(
  value: string | null | undefined,
): "RUB" | "USD" | "EUR" {
  if (value === "USD" || value === "EUR" || value === "RUB") {
    return value;
  }
  return "RUB";
}

function normalizeNotificationPrefs(
  raw: GuideProfileRow["notification_prefs"] | null | undefined,
): Record<string, unknown> {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    return { ...raw } as Record<string, unknown>;
  }
  return {};
}

export default async function PersonalSettingsPage() {
  const auth = await readAuthContextFromServer();

  if (auth.role === "traveler") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">Кабинет путешественника</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Профиль
          </h1>
          <p className="text-sm text-muted-foreground">
            Редактирование профиля путешественника в разработке.
          </p>
        </div>
        <Button asChild>
          <Link href="/traveler/requests">Мои запросы</Link>
        </Button>
      </div>
    );
  }

  if (auth.isAuthenticated && auth.role === "guide") {
    let locale: "ru" | "en" = "ru";
    let preferredCurrency: "RUB" | "USD" | "EUR" = "RUB";
    let notificationPrefs: Record<string, unknown> = {};

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("guide_profiles")
          .select("locale, preferred_currency, notification_prefs")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          locale = normalizeLocale(profile.locale);
          preferredCurrency = normalizeCurrency(profile.preferred_currency);
          notificationPrefs = normalizeNotificationPrefs(
            profile.notification_prefs as GuideProfileRow["notification_prefs"],
          );
        }
      }
    } catch {
      // Render with defaults if Supabase access fails.
    }

    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">
          Личные настройки
        </h1>
        <PersonalSettingsForm
          initialLocale={locale}
          initialCurrency={preferredCurrency}
          initialNotificationPrefs={notificationPrefs}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Профиль</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Войдите в аккаунт
        </h1>
        <p className="text-sm text-muted-foreground">
          Для просмотра настроек профиля необходимо войти.
        </p>
      </div>
      <Button asChild>
        <Link href="/auth?next=/profile/personal">Войти</Link>
      </Button>
    </div>
  );
}
