import { redirect } from "next/navigation";

export default function GuidePortfolioPage() {
  redirect("/guide/excursions?tab=photos");
}
