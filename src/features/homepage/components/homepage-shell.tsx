import { HomePageDestinations } from "@/features/homepage/components/homepage-destinations";
import { HomePageFooter } from "@/features/homepage/components/homepage-footer";
import { HomePageGateway } from "@/features/homepage/components/homepage-gateway";
import { HomePageHero } from "@/features/homepage/components/homepage-hero";
import { HomePageProcess } from "@/features/homepage/components/homepage-process";
import { HomePageTrust } from "@/features/homepage/components/homepage-trust";

export function HomePageShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(62vh,640px)] bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(255,255,255,0.75),rgba(242,237,230,0.35)_45%,transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[420px] h-56 w-[min(100%,880px)] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(242,237,230,0.5)_0%,transparent_100%)] opacity-90"
      />

      <main className="relative z-10 pb-6 pt-1 sm:pb-8">
        <HomePageHero />
        <HomePageGateway />
        <HomePageDestinations />
        <HomePageProcess />
        <HomePageTrust />
        <HomePageFooter />
      </main>
    </div>
  );
}
