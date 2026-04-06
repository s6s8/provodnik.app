import type { Metadata } from "next";
import { TravelerRequestCreateScreen } from "@/features/traveler/components/request-create/traveler-request-create-screen";

export const metadata: Metadata = {
  title: "Новый запрос",
};

export default function TravelerRequestNewPage() {
  return <TravelerRequestCreateScreen />;
}

