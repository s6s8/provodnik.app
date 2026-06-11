"use client";

import * as React from "react";

import { listGuideLocationPhotos } from "@/data/guide-assets/supabase-client";
import { listGuideTemplates } from "@/data/guide-templates/supabase-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideTemplateRow, Uuid } from "@/lib/supabase/types";

type GuidePhoto = { id: string; location_name: string; photoUrl: string };

export function useGuideCatalog() {
  const [guidePhotos, setGuidePhotos] = React.useState<GuidePhoto[]>([]);
  const [guideTemplates, setGuideTemplates] = React.useState<GuideTemplateRow[]>([]);
  const [guideVerificationStatus, setGuideVerificationStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("guide_profiles")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setGuideVerificationStatus(
        typeof profile?.verification_status === "string" ? profile.verification_status : null,
      );
      try {
        const templates = await listGuideTemplates(user.id as Uuid);
        if (!cancelled) {
          setGuideTemplates(templates.filter((template) => template.status === "published"));
        }
      } catch (err) {
        console.error("[bid-panel] failed to load excursions", err);
      }
      try {
        const photos = await listGuideLocationPhotos(user.id as Uuid);
        if (!cancelled) {
          setGuidePhotos(
            photos.map((p) => ({
              id: p.id,
              location_name: p.location_name,
              photoUrl: supabase.storage.from("guide-portfolio").getPublicUrl(p.object_path).data
                .publicUrl,
            })),
          );
        }
      } catch (err) {
        console.error("[bid-panel] failed to load photos", err);
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { guidePhotos, guideTemplates, guideVerificationStatus };
}
