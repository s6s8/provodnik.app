import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/supabase/types";
import { ListingsTable } from "@/features/guide/components/listings-management/ListingsTable";

export default async function ListingsManagementPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, guide_id, title, region, exp_type, status, average_rating, review_count, image_url, price_from_minor, currency, created_at",
    )
    .eq("guide_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ListingRow[]>();

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Управление объявлениями</h1>
        <Button asChild>
          <Link href="/guide/listings/new">Создать объявление</Link>
        </Button>
      </div>
      <ListingsTable listings={listings ?? []} />
    </div>
  );
}
