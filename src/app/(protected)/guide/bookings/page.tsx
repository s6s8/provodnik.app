import type { Metadata } from "next";
import { GuideBookingsScreen } from "@/features/guide/components/bookings/guide-bookings-screen";

export const metadata: Metadata = {
  title: "Мои бронирования",
};

export default function GuideBookingsPage() {
  return <GuideBookingsScreen />;
}

