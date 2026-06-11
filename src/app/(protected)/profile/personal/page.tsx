import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonalSettingsForm } from "@/features/profile/components/PersonalSettingsForm";
import { TravelerProfileCompletionChecklist } from "@/features/profile/components/traveler-profile-completion-checklist";
import {
  TravelerProfileForm,
  type TravelerProfile,
} from "@/features/profile/components/traveler-profile-form";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { readDemoTravelerProfileFromCookies } from "@/lib/demo-traveler-profile";
import { loadTravelerProfileFromSupabase } from "@/lib/profile/load-traveler-profile";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideProfileRow } from "@/lib/supabase/types";
import { AvatarUploadBlock } from "@/app/(protected)/profile/_components/avatar-upload-block";

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

async function fetchAvatar(userId: string | null | undefined, fallbackName: string): Promise<{ url: string | null; name: string }> {
  if (!userId) return { url: null, name: fallbackName };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const row = (data ?? null) as { avatar_url?: string | null; full_name?: string | null } | null;
  return {
    url: row?.avatar_url ?? null,
    name: row?.full_name?.trim() || fallbackName,
  };
}

export default async function PersonalSettingsPage() {
  const auth = await readAuthContextFromServer();

  if (auth.isAuthenticated && auth.role === "traveler") {
    const displayNameFallback =
      auth.fullName?.trim() || auth.email || "Путешественник";
    let travelerProfile: TravelerProfile = {
      full_name: null,
      avatar_url: auth.avatarUrl,
      bio: null,
      home_city: null,
      languages: null,
      birth_year: null,
    };

    if (auth.source === "demo") {
      const demoProfile = await readDemoTravelerProfileFromCookies();
      if (demoProfile) {
        const storedName = demoProfile.full_name?.trim();
        travelerProfile = {
          ...travelerProfile,
          full_name: storedName || null,
          bio: demoProfile.bio ?? null,
          home_city: demoProfile.home_city ?? null,
          languages: demoProfile.languages?.length ? demoProfile.languages : null,
          birth_year: demoProfile.birth_year ?? null,
        };
      }
    } else if (auth.userId && auth.hasSupabaseEnv) {
      try {
        const supabase = await createSupabaseServerClient();
        const loaded = await loadTravelerProfileFromSupabase(supabase, auth.userId);
        if (loaded) {
          travelerProfile = loaded;
        }
      } catch {
        // render with auth fallbacks
      }
    }

    const avatarDisplayName =
      travelerProfile.full_name?.trim() || displayNameFallback;

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">Кабинет путешественника</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Профиль
          </h1>
        </div>
        <TravelerProfileCompletionChecklist profile={travelerProfile} />
        <AvatarUploadBlock
          avatarUrl={travelerProfile.avatar_url}
          displayName={avatarDisplayName}
        />
        <TravelerProfileForm
          key={[
            travelerProfile.full_name,
            travelerProfile.home_city,
            travelerProfile.bio,
            travelerProfile.birth_year,
            travelerProfile.languages?.join(","),
          ].join("|")}
          profile={travelerProfile}
        />
        <Button asChild variant="outline">
          <Link href="/traveler/requests">Мои запросы</Link>
        </Button>
      </div>
    );
  }

  if (auth.isAuthenticated && auth.role === "guide") {
    let locale: "ru" | "en" = "ru";
    let preferredCurrency: "RUB" | "USD" | "EUR" = "RUB";
    let notificationPrefs: Record<string, unknown> = {};

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error } = await supabase
        .from("guide_profiles")
        .select("locale, preferred_currency, notification_prefs")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      if (profile) {
        locale = normalizeLocale(profile.locale);
        preferredCurrency = normalizeCurrency(profile.preferred_currency);
        notificationPrefs = normalizeNotificationPrefs(
          profile.notification_prefs as GuideProfileRow["notification_prefs"],
        );
      }
    }

    const avatar = await fetchAvatar(
      auth.userId,
      resolveDisplayName("guide", { full_name: auth.email ?? null }),
    );
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">
          Личные настройки
        </h1>
        <AvatarUploadBlock avatarUrl={avatar.url} displayName={avatar.name} />
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
