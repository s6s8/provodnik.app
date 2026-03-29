import { SiteFooter } from "@/components/shared/site-footer";
import { HomePageDestinations } from "@/features/homepage/components/homepage-destinations";
import { HomePageGateway } from "@/features/homepage/components/homepage-gateway";
import { HomePageHero } from "@/features/homepage/components/homepage-hero";
import { HomePageProcess } from "@/features/homepage/components/homepage-process";
import { HomePageTrust } from "@/features/homepage/components/homepage-trust";

export function HomePageShell() {
  return (
    <>
      <HomePageHero />
      <HomePageGateway />
      <HomePageDestinations />
      <HomePageProcess />
      <HomePageTrust />
      <SiteFooter />
    </>
  );
}
