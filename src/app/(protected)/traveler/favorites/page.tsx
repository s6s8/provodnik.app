import type { Metadata } from "next";
import { TravelerFavoritesScreen } from "@/features/traveler/components/favorites/traveler-favorites-screen";

export const metadata: Metadata = {
  title: "Избранное",
};

export default function TravelerFavoritesPage() {
  return <TravelerFavoritesScreen />;
}

