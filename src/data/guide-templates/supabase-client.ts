"use client";

import { rubToKopecks } from "@/data/money";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideTemplateRow, Uuid } from "@/lib/supabase/types";

type CreateGuideTemplateInput = {
  title: string;
  description?: string | null;
  durationText?: string | null;
  priceFromRub?: number | null;
  isVisible?: boolean;
};

type UpdateGuideTemplateInput = {
  title?: string;
  description?: string | null;
  durationText?: string | null;
  priceFromRub?: number | null;
  isVisible?: boolean;
};

function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

export async function listGuideTemplates(guideId: Uuid): Promise<GuideTemplateRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("guide_templates")
    .select("*")
    .eq("guide_id", guideId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GuideTemplateRow[];
}

export async function createGuideTemplate(
  input: CreateGuideTemplateInput,
): Promise<GuideTemplateRow> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }
  if (!user) {
    throw new Error("User must be authenticated to create templates.");
  }

  const { data, error } = await supabase
    .from("guide_templates")
    .insert({
      guide_id: user.id,
      title: input.title,
      description: input.description ?? null,
      duration_text: input.durationText ?? null,
      price_from_kopecks:
        input.priceFromRub == null ? null : rubToKopecks(input.priceFromRub),
      is_visible: input.isVisible ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as GuideTemplateRow;
}

export async function updateGuideTemplate(
  id: Uuid,
  input: UpdateGuideTemplateInput,
): Promise<GuideTemplateRow> {
  const supabase = getSupabaseClient();
  const update: Partial<GuideTemplateRow> = {
    updated_at: new Date().toISOString(),
  };

  if ("title" in input) update.title = input.title;
  if ("description" in input) update.description = input.description ?? null;
  if ("durationText" in input) update.duration_text = input.durationText ?? null;
  if ("priceFromRub" in input) {
    update.price_from_kopecks =
      input.priceFromRub == null ? null : rubToKopecks(input.priceFromRub);
  }
  if ("isVisible" in input) update.is_visible = input.isVisible;

  const { data, error } = await supabase
    .from("guide_templates")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as GuideTemplateRow;
}

export async function deleteGuideTemplate(id: Uuid): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("guide_templates").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
