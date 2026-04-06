import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Кабинет путешественника",
};

export default function TravelerPage() {
  redirect("/traveler/dashboard");
}
