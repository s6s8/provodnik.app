import { redirect } from "next/navigation";

import { flags } from "@/lib/flags";

import { NotificationPreferencesClient } from "./notification-preferences-client";

export default function NotificationPreferencesPage() {
  // Feature is flag-gated. When it is off, redirect to the settings hub on the
  // server instead of calling notFound() during a client render — the latter
  // aborts the Suspense boundary and surfaces as React error #419 (PRD-035).
  if (!flags.FEATURE_TR_NOTIFICATIONS) {
    redirect("/account");
  }

  return <NotificationPreferencesClient />;
}
