import type { Metadata } from "next";
import { Suspense } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardGridSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicRequestsMarketplaceScreen } from "@/features/requests/components/public-requests-marketplace-screen";
import { PUBLIC_CATALOG_PAGE_SIZE } from "@/lib/catalog-pagination";
import { loadPublicOpenRequestsPage } from "@/lib/supabase/public-open-requests-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function RequestsListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-page flex flex-col gap-8 px-[clamp(20px,4vw,48px)] py-16">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: "Запросы",
    description: "Запросы путешественников — предложите свои услуги гида",
  };
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<RequestsListSkeleton />}>
      <RequestsContent />
    </Suspense>
  );
}

export async function RequestsContent() {
  let initialData = null;
  let hasMore = false;
  let loadError = false;

  try {
    const supabase = await createSupabaseServerClient();
    const page = await loadPublicOpenRequestsPage(
      supabase,
      0,
      PUBLIC_CATALOG_PAGE_SIZE,
    );
    if (page.error) {
      loadError = true;
    } else {
      initialData = page.items;
      hasMore = page.hasMore;
    }
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] py-10">
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить запросы. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PublicRequestsMarketplaceScreen
      initialData={initialData}
      initialHasMore={hasMore}
      initialOffset={initialData?.length ?? 0}
    />
  );
}