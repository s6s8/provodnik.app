"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createListing,
  updateListing,
  publishListing,
  pauseListing,
  softDeleteListing,
} from "@/lib/supabase/listings";
import type { ListingInput } from "@/lib/supabase/listing-schema";

async function getCurrentGuideId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("Не авторизован.");
  }

  return session.user.id;
}

export async function createListingAction(
  data: ListingInput,
): Promise<{ id?: string; error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    const listing = await createListing(data, guideId);
    return { id: listing.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка создания тура.",
    };
  }
}

export async function updateListingAction(
  id: string,
  data: ListingInput,
): Promise<{ id?: string; error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    const listing = await updateListing(id, data, guideId);
    return { id: listing.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка обновления тура.",
    };
  }
}

export async function publishListingAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    await publishListing(id, guideId);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка публикации тура.",
    };
  }
}

export async function pauseListingAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    await pauseListing(id, guideId);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка приостановки тура.",
    };
  }
}

export async function deleteListingAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    await softDeleteListing(id, guideId);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка удаления тура.",
    };
  }
}
