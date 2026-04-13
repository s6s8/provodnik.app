"use server";

import { redirect } from "next/navigation";

import { joinRequest, isRequestMember } from "@/lib/supabase/request-members";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Uuid } from "@/lib/supabase/types";

export type JoinRequestResult = {
  error: string | null;
  joined?: boolean;
};

export async function joinRequestAction(
  requestId: string,
): Promise<JoinRequestResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  const travelerId = user.id as unknown as Uuid;
  const requestUuid = requestId as unknown as Uuid;

  // Already a member? Return success without error
  const alreadyMember = await isRequestMember(requestUuid, travelerId);
  if (alreadyMember) {
    return { error: null, joined: true };
  }

  // Verify the request is still open and not owned by this user
  const { data: request } = await supabase
    .from("traveler_requests")
    .select("id, traveler_id, status")
    .eq("id", requestUuid)
    .maybeSingle();

  if (!request) {
    return { error: "Запрос не найден." };
  }

  if (request.traveler_id === travelerId) {
    return { error: "Нельзя присоединиться к собственному запросу." };
  }

  if (request.status !== "open") {
    return { error: "Запрос уже закрыт." };
  }

  try {
    await joinRequest(requestUuid, travelerId);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Не удалось присоединиться.",
    };
  }

  return { error: null, joined: true };
}

