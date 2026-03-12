import { FoundationGrid } from "@/features/home/components/foundation-grid";
import { HeroSection } from "@/features/home/components/hero-section";
import { PainPointsGrid } from "@/features/home/components/pain-points-grid";
import { WorkstreamsGrid } from "@/features/home/components/workstreams-grid";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PainPointsGrid />
      <FoundationGrid />
      <WorkstreamsGrid />
    </>
  );
}
