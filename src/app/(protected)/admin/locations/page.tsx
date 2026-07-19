import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { requireAdminSession } from "@/lib/supabase/moderation";
import { listAllLocations } from "@/lib/supabase/location-catalog";
import { LocationsConsole } from "./_components/locations-console";

export const metadata: Metadata = { title: "Локации" };

/**
 * Admin-curated location catalogue (item 3). Guides pick active locations here instead
 * of typing free text on ready tours and photobank uploads. Service-role read: the
 * catalogue table's RLS restricts writes to admins; the console actions re-check.
 */
export default async function AdminLocationsPage() {
  const { adminClient } = await requireAdminSession();
  const locations = await listAllLocations(adminClient);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Администрирование"
        title="Локации"
        subtitle="Канонический список локаций для готовых экскурсий и фотобанка гидов. Архивные локации не предлагаются гидам, но уже сохранённые значения не теряются."
      />
      <LocationsConsole locations={locations} />
    </div>
  );
}
