import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";

import { HomePageDiscovery } from "./homepage-discovery";
import { HomePageGuideAcquisition } from "./homepage-guide-acquisition";
import { HomePageHero2 } from "./homepage-hero2";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
}

export function HomePageShell2({ destinations, requests }: Props) {
  return (
    <>
      <HomePageHero2 destinations={destinations} />
      <HomePageDiscovery requests={requests} />
      <HomePageGuideAcquisition />
      <SiteFooter />
    </>
  );
}
