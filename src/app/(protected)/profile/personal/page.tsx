import type { Metadata } from "next";
import { redirect } from "next/navigation";

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

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/profile/personal");
  }

  if (auth.role && auth.role !== "guide") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  let locale: "ru" | "en" = "ru";
  let preferredCurrency: "RUB" | "USD" | "EUR" = "RUB";
  let notificationPrefs: Record<string, unknown> = {};

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/profile/personal");
    }

    const { data: profile } = await supabase
      .from("guide_profiles")
      .select("locale, preferred_currency, notification_prefs")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      redirect("/guide/settings");
    }

    locale = normalizeLocale(profile.locale);
    preferredCurrency = normalizeCurrency(profile.preferred_currency);
    notificationPrefs = normalizeNotificationPrefs(
      profile.notification_prefs as GuideProfileRow["notification_prefs"],
    );
  } catch {
    redirect("/guide");
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
