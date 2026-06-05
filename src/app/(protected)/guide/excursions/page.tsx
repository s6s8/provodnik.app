import type { Metadata } from "next";
import { GuideExcursionsScreen } from "@/features/guide/components/excursions/guide-excursions-screen";

export const metadata: Metadata = { title: "Мои экскурсии" };

export default async function GuideExcursionsPage() {
  return <GuideExcursionsScreen guideId="" />;
}
