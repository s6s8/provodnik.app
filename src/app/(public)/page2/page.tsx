import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { seededPublicListings } from "@/data/public-listings/seed";
import { FoundationGrid } from "@/features/home/components/foundation-grid";
import { HeroSection } from "@/features/home/components/hero-section";
import { LayoutGridShowcase } from "@/features/home/components/layout-grid-showcase";
import { PainPointsGrid } from "@/features/home/components/pain-points-grid";
import { WorkstreamsGrid } from "@/features/home/components/workstreams-grid";
import { PublicListingCard } from "@/features/listings/components/public/public-listing-card";

export default function PageTwoHomePage() {
  return (
    <>
      <LayoutGridShowcase />
      <HeroSection />
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="editorial-kicker">Подборка недели</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Готовые маршруты, с которых удобно начать знакомство с сервисом
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link href="/listings">
              Весь каталог
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {seededPublicListings.map((listing) => (
            <PublicListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      </section>
      <PainPointsGrid />
      <FoundationGrid />
      <WorkstreamsGrid />
    </>
  );
}
