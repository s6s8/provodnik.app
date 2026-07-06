"use server";

import { redirect } from "next/navigation";

import { rubToKopecks } from "@/data/money";
import { travelerRequestSchema } from "@/data/traveler-request/schema";
import type { TravelerRequest } from "@/data/traveler-request/schema";
import { createTravelerRequest, type CreateRequestInput } from "@/lib/supabase/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { notifyGuidesNewRequest } from "@/lib/notifications/triggers";
import { logFunnelEvent } from "@/lib/analytics/marketplace-events";

export type CreateRequestState = {
  error: string | null;
  fieldErrors?: Partial<Record<string, string[]>>;
  // Set only when the request failed because the caller is not signed in.
  // The client gates to the auth flow on this code alone — never on a
  // browser-side getUser() pre-check, which races the cookie refresh.
  code?: "auth_required";
};

export async function buildRequestInsertPayload(
  input: TravelerRequest,
  opts: { allowGuideSuggestions: boolean },
): Promise<CreateRequestInput> {
  const isAss = input.mode === "assembly";

  return {
    destination: input.destination,
    interests: input.interests,
    requested_languages: input.requestedLanguages ?? [],
    starts_on: input.startDate,
    ends_on: input.endDate || input.startDate,
    date_flexibility: input.dateFlexibility ?? "exact",
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    budget_minor: rubToKopecks(input.budgetPerPersonRub),
    participants_count: isAss ? (input.groupSizeCurrent ?? 1) : (input.groupSize ?? 1),
    format_preference: isAss ? "group" : "private",
    notes: input.notes || null,
    open_to_join: isAss,
    date_locked: !opts.allowGuideSuggestions,
    time_locked: !opts.allowGuideSuggestions,
    region: null,
    preferred_guide_slug: input.preferredGuideSlug || null,
  };
}

export async function createRequestAction(
  _prev: CreateRequestState,
  formData: FormData,
): Promise<CreateRequestState> {
  const mode = formData.get("mode") as string;
  const isAssembly = mode === "assembly";

  const raw = {
    mode,
    interests: formData.getAll("interests[]").map(String),
    requestedLanguages: formData.getAll("requested_languages[]").map(String),
    destination: (formData.get("destination") as string) ?? "",
    startDate: (formData.get("startDate") as string) ?? "",
    endDate: (formData.get("endDate") as string) || undefined,
    dateFlexibility: (formData.get("dateFlexibility") as string) || "exact",
    startTime: (formData.get("startTime") as string) || undefined,
    endTime: (formData.get("endTime") as string) || undefined,
    ...(isAssembly
      ? {
          groupSizeCurrent: Number(formData.get("groupSizeCurrent") ?? 1),
        }
      : {
          groupSize: Number(formData.get("groupSize") ?? 1),
        }),
    // form-epic #14: keep schema compat by always defaulting to true
    // server-side. Field is no longer pushed through the form.
    allowGuideSuggestionsOutsideConstraints: true,
    budgetPerPersonRub: Number(formData.get("budgetPerPersonRub") ?? 0),
    notes: (formData.get("notes") as string) ?? "",
    preferredGuideSlug: (formData.get("preferredGuideSlug") as string) || undefined,
  };

  const result = travelerRequestSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Partial<Record<string, string[]>> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return { error: "Пожалуйста, исправьте ошибки в форме.", fieldErrors };
  }

  const input = result.data;

  if (!hasSupabaseEnv()) {
    return {
      error: "Отправка запроса временно недоступна. Напишите в поддержку.",
    };
  }

  let travelerId: string;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Необходимо войти в систему для создания запроса.", code: "auth_required" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return { error: "Не удалось проверить статус аккаунта. Попробуйте ещё раз." };
    }

    if (profile?.account_status && profile.account_status !== "active") {
      return { error: "Аккаунт ограничен. Создание новых запросов недоступно." };
    }

    travelerId = user.id;
  } catch {
    return { error: "Ошибка авторизации. Попробуйте обновить страницу.", code: "auth_required" };
  }

  let requestId: string;
  try {
    const allowGuideSuggestions = formData.get("allowGuideSuggestions") === "true";
    const record = await createTravelerRequest(
      await buildRequestInsertPayload(input, { allowGuideSuggestions }),
      travelerId,
    );
    requestId = record.id;
  } catch (err) {
    const pg = err as { message?: string; code?: string };
    const message = pg?.message ?? "Неизвестная ошибка при сохранении.";
    return { error: `Не удалось сохранить запрос: ${message}` };
  }

  try {
    await notifyGuidesNewRequest(requestId);
  } catch {
    // notification errors are non-fatal — traveler redirect proceeds
  }

  await logFunnelEvent({
    event_type: "request_created",
    scope: "request",
    request_id: requestId,
    actor_id: travelerId,
    summary: "Заявка создана",
    payload: { mode: input.mode },
  });

  redirect(`/requests/${requestId}?created=1&mode=${input.mode}`);
}
