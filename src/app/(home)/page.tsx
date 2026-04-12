import { FeaturedGrid, type FeaturedGridListing } from "@/components/traveler/FeaturedGrid";
import { HeroSearch } from "@/components/traveler/HeroSearch";
import { getDestinations, getOpenRequests, type DestinationRecord, type RequestRecord } from "@/data/supabase/queries";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomePageShell } from "@/features/homepage/components/homepage-shell";

const TRIPSTER_HOME_REGIONS = [
  "Москва",
  "Санкт-Петербург",
  "Сочи",
  "Казань",
  "Нижний Новгород",
  "Калининград",
  "Екатеринбург",
  "Байкал",
  "Алтай",
  "Карелия",
] as const;

export default async function HomePage() {
  if (flags.FEATURE_TRIPSTER_V1) {
    let featured: FeaturedGridListing[] = [];

    try {
      const supabase = await createSupabaseServerClient();
      let { data: featuredRows } = await supabase
        .from("listings")
        .select(
          "id, title, region, city, exp_type, price_from_minor, duration_minutes, average_rating, image_url, featured_rank",
        )
        .eq("status", "active")
        .not("featured_rank", "is", null)
        .order("featured_rank", { ascending: true })
        .limit(12);

      if (!featuredRows || featuredRows.length === 0) {
        const { data: recent } = await supabase
          .from("listings")
          .select(
            "id, title, region, city, exp_type, price_from_minor, duration_minutes, average_rating, image_url, featured_rank",
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12);
        featuredRows = recent ?? [];
      }

      featured = (featuredRows ?? []) as FeaturedGridListing[];
    } catch {
      featured = [];
    }

    return (
      <main className="min-h-screen">
        <section className="bg-surface-high px-4 py-20 text-center">
          <h1 className="font-display mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Найдите идеальный тур
          </h1>
          <p className="mb-8 text-lg text-ink-2">
            Экскурсии, туры, трансферы — от проверенных гидов
          </p>
          <HeroSearch regions={[...TRIPSTER_HOME_REGIONS]} />
        </section>
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">Популярные предложения</h2>
          <FeaturedGrid listings={featured} />
        </section>
      </main>
    );
  }

  let destinations: DestinationRecord[] = [];
  let requests: RequestRecord[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const [destResult, reqResult] = await Promise.all([
      getDestinations(supabase),
      getOpenRequests(supabase),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
  } catch {}

  return <HomePageShell destinations={destinations} requests={requests} />;
}
