import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ReadyExcursionDetail } from "@/features/listings/components/public/ready-excursion-detail";
import { flags } from "@/lib/flags";
import { getPublishedTemplateDetail } from "@/lib/supabase/guide-template-listings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getReadyExcursion = cache(async (templateId: string) => {
  const supabase = await createSupabaseServerClient();
  return getPublishedTemplateDetail(supabase, templateId);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getReadyExcursion(id);
  if (!detail) notFound();

  return {
    title: detail.title,
    description: detail.description ?? detail.title,
    alternates: { canonical: `/excursions/${detail.id}` },
  };
}

export default async function ReadyExcursionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!flags.FEATURE_PUBLIC_CATALOG) notFound();

  const { id } = await params;
  const detail = await getReadyExcursion(id);
  if (!detail) notFound();

  return <ReadyExcursionDetail detail={detail} />;
}
