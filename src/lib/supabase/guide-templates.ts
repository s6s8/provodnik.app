"use client";

import { rubToKopecks } from "@/data/money";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideTemplateRow, Uuid } from "@/lib/supabase/types";

type CreateGuideTemplateInput = {
  title: string;
  description?: string | null;
  durationText?: string | null;
  priceFromRub?: number | null;
  meetingPoint?: string | null;
  maxParticipants?: number | null;
  photoUrls?: string[];
  status?: "draft" | "pending_review";
  region?: string | null;
  category?: string | null;
};

type UpdateGuideTemplateInput = {
  title?: string;
  description?: string | null;
  durationText?: string | null;
  priceFromRub?: number | null;
  meetingPoint?: string | null;
  maxParticipants?: number | null;
  photoUrls?: string[];
  status?: "draft" | "pending_review";
  region?: string | null;
  category?: string | null;
};

function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

export async function uploadTemplatePhoto(input: {
  guideId: Uuid;
  file: File;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const safeName = input.file.name.replace(/[^a-z0-9.]/gi, "-");
  const objectPath = `${input.guideId}/templates/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from("guide-portfolio")
    .upload(objectPath, input.file, { upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from("guide-portfolio").getPublicUrl(objectPath).data.publicUrl;
}

export async function listGuideTemplates(guideId: Uuid): Promise<GuideTemplateRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("guide_templates")
    .select("*")
    .eq("guide_id", guideId)
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
      // New ready tours are priced per group (item 2). Legacy rows keep per_person.
      price_scope: "per_group",
      meeting_point: input.meetingPoint ?? null,
      max_participants: input.maxParticipants ?? null,
      photo_urls: input.photoUrls ?? [],
      status: input.status ?? "draft",
      region: input.region ?? null,
      category: input.category ?? null,
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
  if ("meetingPoint" in input) update.meeting_point = input.meetingPoint ?? null;
  if ("maxParticipants" in input) update.max_participants = input.maxParticipants ?? null;
  if ("photoUrls" in input) update.photo_urls = input.photoUrls ?? [];
  if ("status" in input) update.status = input.status ?? "draft";
  if ("region" in input) update.region = input.region ?? null;
  if ("category" in input) update.category = input.category ?? null;

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

export async function deleteTemplatePhoto(input: {
  guideId: Uuid;
  photoUrl: string;
  templateId: Uuid;
  currentPhotoUrls: string[];
}): Promise<GuideTemplateRow> {
  const supabase = getSupabaseClient();
  const baseUrl = supabase.storage.from("guide-portfolio").getPublicUrl("").data.publicUrl;
  const objectPath = input.photoUrl.replace(baseUrl, "");

  await supabase.storage.from("guide-portfolio").remove([objectPath]).catch(() => undefined);

  const newUrls = input.currentPhotoUrls.filter((url) => url !== input.photoUrl);
  return updateGuideTemplate(input.templateId, { photoUrls: newUrls });
}
