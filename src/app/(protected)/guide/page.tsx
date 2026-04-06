import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Кабинет гида",
};

export default function GuidePage() {
  redirect("/guide/dashboard");
}
