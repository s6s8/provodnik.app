import type { Metadata } from "next";
import { NotificationCenterScreen } from "@/features/notifications/components/notification-center-screen";

export const metadata: Metadata = {
  title: "Уведомления",
};

export default function NotificationsPage() {
  return <NotificationCenterScreen />;
}

