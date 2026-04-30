import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { kopecksToRub } from "@/data/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  region: string;
  currentListingId: string;
};

export async function TransferCrossSellWidget({ region, currentListingId }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: transfers } = await supabase
    .from("listings")
    .select("id, title, price_from_minor, image_url, vehicle_type, max_group_size")
    .eq("status", "published")
    .eq("exp_type", "transfer")
    .eq("region", region)
    .neq("id", currentListingId)
    .limit(3);

  if (!transfers || transfers.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Трансфер в регионе</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {transfers.map((t) => (
          <a
            key={t.id}
            href={`/listings/${t.id}`}
            className="block rounded-glass border border-border hover:shadow-glass transition-shadow overflow-hidden"
          >
            {t.image_url && (
              <div className="relative aspect-video w-full">
                <Image
                  src={t.image_url}
                  alt={t.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-3 flex flex-col gap-1">
              <p className="text-sm font-medium line-clamp-2">{t.title}</p>
              {t.vehicle_type && (
                <Badge variant="secondary" className="w-fit text-xs">
                  {t.vehicle_type}
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                от {kopecksToRub(t.price_from_minor)} ₽
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
