import Link from "next/link";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export function HomePageGuideAcquisition() {
  return (
    <section
      aria-label="Стать гидом"
      className="border-t border-outline-variant/40 bg-surface-high py-16"
    >
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] text-center">
        <h2 className="font-display mb-3 text-2xl font-semibold text-foreground md:text-3xl">
          Вы гид? Принимайте запросы от путешественников.
        </h2>
        <p className="mb-2 text-lg text-ink-2">
          {COPY.zeroCommission}
        </p>
        <p className="mb-8 text-sm text-ink-3">
          Путешественники уже публикуют запросы. Предлагайте свои условия напрямую.
        </p>
        <Button asChild size="lg">
          <Link href="/for-guides">{COPY.nav.becomeGuide}</Link>
        </Button>
      </div>
    </section>
  );
}
