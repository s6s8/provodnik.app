"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useState } from "react";

import {
  NotificationPrefsMatrix,
  type NotificationPrefsMatrixProps,
} from "@/features/profile/components/NotificationPrefsMatrix";
import { updatePersonalSettings } from "@/features/profile/actions/updatePersonalSettings";
import { flags } from "@/lib/flags";

// Gate: feature flag check
if (!flags.FEATURE_TR_NOTIFICATIONS) {
  notFound();
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback<NotificationPrefsMatrixProps["onChange"]>(
    async (updatedPrefs) => {
      setPrefs(updatedPrefs);
      setSaving(true);
      setSaved(false);
      try {
        await updatePersonalSettings({
          locale: "ru",
          preferredCurrency: "RUB",
          notificationPrefs: updatedPrefs,
        });
        setSaved(true);
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
          href="/profile/personal"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Личные настройки
        </Link>
      </div>

      <NotificationPrefsMatrix prefs={prefs} onChange={handleChange} />

      {saving && (
        <p className="text-sm text-muted-foreground">Сохранение…</p>
      )}
      {!saving && saved && (
        <p className="text-sm text-green-600">Настройки сохранены</p>
      )}
    </div>
  );
}
