import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationCenterScreen } from "@/features/notifications/components/notification-center-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Уведомления",
};

export default async function NotificationsPage() {
  if (!hasSupabaseEnv()) {
    return <NotificationCenterScreen />;
  }

  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated || !auth.userId) {
    redirect("/auth?next=/notifications");
  }

  return <NotificationCenterScreen />;
}

