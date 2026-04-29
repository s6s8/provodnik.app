import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Туры",
};

export default function ToursPage() {
  if (!flags.FEATURE_TR_TOURS) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Туры</h1>
      <p className="mt-2 text-muted-foreground">Многодневные туры — скоро.</p>
    </div>
  );
}
