import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getLocation, listLocationMedia } from "@/lib/supabase/location-media";
import { requireAdminSession } from "@/lib/supabase/moderation";
import { LocationMediaConsole } from "./_components/location-media-console";

export const metadata: Metadata = { title: "Медиа локации" };

/**
 * Editorial media for one canonical location. The published primary cover replaces the
 * branded gradient on public request cards and request heroes; drafts stay admin-only.
 */
export default async function AdminLocationMediaPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const { adminClient } = await requireAdminSession();
  const location = await getLocation(adminClient, locationId);
  if (!location) notFound();

  const media = await listLocationMedia(adminClient, location.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/locations">
            <ArrowLeft size={16} />
            Все локации
          </Link>
        </Button>
      </div>
      <PageHeader
        eyebrow="Администрирование"
        title={location.name}
        subtitle="Медиа локации. Опубликованная главная обложка показывается на карточках и в шапке запросов для этой локации. Без опубликованной обложки остаётся фирменный градиент."
      />
      <LocationMediaConsole locationId={location.id} locationName={location.name} media={media} />
    </div>
  );
}
