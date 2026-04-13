import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Статистика",
};

export default function GuideStatsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Статистика</h1>
      <p className="mt-2 text-muted-foreground">Скоро здесь будут ваши показатели.</p>
    </div>
  );
}
