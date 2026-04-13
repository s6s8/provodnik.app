import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationRecord, RequestRecord } from "@/data/supabase/queries";
import { HomePageDestinations } from "@/features/homepage/components/homepage-destinations";
import { HomePageGateway } from "@/features/homepage/components/homepage-gateway";
import { HomePageGuideAcquisition } from "@/features/homepage/components/homepage-guide-acquisition";
import { HomePageHero } from "@/features/homepage/components/homepage-hero";
import { HomePageProcess } from "@/features/homepage/components/homepage-process";
import { HomePageTrust } from "@/features/homepage/components/homepage-trust";

interface Props {
  destinations: DestinationRecord[];
  requests: RequestRecord[];
}

export function HomePageShell({ destinations, requests }: Props) {
  return (
    <>
      <HomePageHero />
      <HomePageGateway requests={requests} />
      <HomePageDestinations destinations={destinations} />
      <HomePageProcess />
      <HomePageTrust />
      <HomePageGuideAcquisition />
      <SiteFooter />
    </>
  );
}
