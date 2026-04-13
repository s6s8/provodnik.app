import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Туры",
};

export default function ToursPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Туры</h1>
      <p className="mt-2 text-muted-foreground">Многодневные туры — скоро.</p>
    </div>
  );
}
