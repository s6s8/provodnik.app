import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Как это работает",
};

export default function HowItWorksPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Как это работает</h1>
      <p className="mt-2 text-muted-foreground">Скоро здесь будет подробный гайд.</p>
    </div>
  );
}
