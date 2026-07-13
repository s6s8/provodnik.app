"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  NotificationPrefsMatrix,
  type NotificationPrefsMatrixProps,
} from "@/features/profile/components/NotificationPrefsMatrix";
import { getPersonalSettings } from "@/features/profile/actions/getPersonalSettings";
import { updatePersonalSettings } from "@/features/profile/actions/updatePersonalSettings";

export function NotificationPreferencesClient() {
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await getPersonalSettings();
        if (active && result) {
          setPrefs(result.notificationPrefs);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = useCallback<NotificationPrefsMatrixProps["onChange"]>(
    async (updatedPrefs) => {
      setPrefs(updatedPrefs);
      setSaving(true);
      setSaved(false);
      setSaveError(false);
      try {
        await updatePersonalSettings({
          locale: "ru",
          preferredCurrency: "RUB",
          notificationPrefs: updatedPrefs,
        });
        setSaved(true);
      } catch {
        setSaveError(true);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Кабинет"
        title="Настройки уведомлений"
        subtitle="Управляйте тем, какие уведомления и через какие каналы вы получаете."
        actions={
          <Link
            href="/account"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Личные настройки
          </Link>
        }
      />

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Загрузка настроек"
          className="flex flex-col gap-3"
        >
          <Skeleton className="h-9 w-56" />
          <Skeleton variant="card" />
        </div>
      ) : (
        <NotificationPrefsMatrix prefs={prefs} onChange={handleChange} />
      )}

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "text-sm",
          saveError ? "text-destructive" : saved ? "text-success-text" : "text-muted-foreground",
        )}
      >
        {saving
          ? "Сохранение…"
          : saveError
            ? "Не удалось сохранить. Попробуйте ещё раз."
            : saved
              ? "Настройки сохранены"
              : ""}
      </p>
    </div>
  );
}
