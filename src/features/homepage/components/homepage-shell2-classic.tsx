import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";

import { HomePageDiscovery } from "./homepage-discovery";
import { HomepageHeroFormClassic } from "./homepage-hero-form-classic";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
}

export function HomePageShell2Classic({ destinations, requests }: Props) {
  return (
    <>
      <HomepageHeroFormClassic destinations={destinations} />
      <HomePageDiscovery requests={requests} />
      <SiteFooter />
    </>
  );
}
