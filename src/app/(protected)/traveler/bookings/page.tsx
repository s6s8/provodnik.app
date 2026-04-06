import type { Metadata } from "next";
import { TravelerBookingsScreen } from "@/features/traveler/components/bookings/traveler-bookings-screen";

export const metadata: Metadata = {
  title: "Мои бронирования",
};

export default function TravelerBookingsPage() {
  return <TravelerBookingsScreen />;
}

