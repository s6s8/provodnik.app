import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Новый запрос",
};

export default async function TravelerRequestNewPage() {
  redirect("/");
}
