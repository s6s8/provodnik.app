import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Стать гидом",
};

export default function ForGuidesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Стать гидом</h1>
      <p className="mt-2 text-muted-foreground">0% комиссия. Принимайте запросы напрямую.</p>
    </div>
  );
}
