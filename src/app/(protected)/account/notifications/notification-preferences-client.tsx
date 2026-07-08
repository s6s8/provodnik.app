"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Настройки уведомлений
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте тем, какие уведомления и через какие каналы вы получаете.
          </p>
        </div>
        <Link
          href="/account"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Личные настройки
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка настроек…</p>
      ) : (
        <NotificationPrefsMatrix prefs={prefs} onChange={handleChange} />
      )}

      {saving && <p className="text-sm text-muted-foreground">Сохранение…</p>}
      {!saving && saved && (
        <p className="text-sm text-success">Настройки сохранены</p>
      )}
      {!saving && saveError && (
        <p className="text-sm text-destructive">
          Не удалось сохранить. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}
