import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";

import { HomePageDiscovery } from "./homepage-discovery";
import { HomepageHeroForm } from "./homepage-hero-form";
import { HomePageSteps } from "./homepage-steps";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
}

export function HomePageShell2({ destinations, requests }: Props) {
  return (
    <>
      <HomePageSteps />
      <HomepageHeroForm destinations={destinations} />
      <HomePageDiscovery requests={requests} />
      <SiteFooter />
    </>
  );
}
