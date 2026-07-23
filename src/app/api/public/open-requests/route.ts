import { NextResponse } from "next/server";

import { PUBLIC_CATALOG_PAGE_SIZE } from "@/lib/catalog-pagination";
import { hasSupabaseEnv } from "@/lib/env";
import { loadPublicOpenRequestsPage } from "@/lib/supabase/public-open-requests-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  const url = new URL(request.url);
  const offsetRaw = Number(url.searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

  const supabase = await createSupabaseServerClient();
  const page = await loadPublicOpenRequestsPage(supabase, offset, PUBLIC_CATALOG_PAGE_SIZE);

  if (page.error) {
    return NextResponse.json({ error: "Не удалось загрузить запросы." }, { status: 500 });
  }

  return NextResponse.json({
    items: page.items,
    hasMore: page.hasMore,
  });
}
