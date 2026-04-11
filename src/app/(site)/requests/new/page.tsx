import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Создать запрос",
  description: "Оставьте заявку: мы поможем найти группу и предложить цену с местным гидом.",
};

export default async function CreateRequestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, v);
    } else if (typeof value === "string") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  redirect(`/traveler/requests/new${qs ? `?${qs}` : ""}`);
}
