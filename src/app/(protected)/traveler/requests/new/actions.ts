"use server";

import { redirect } from "next/navigation";

import { travelerRequestSchema } from "@/data/traveler-request/schema";
import { rubToKopecks } from "@/data/money";
import { createTravelerRequest } from "@/lib/supabase/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export type CreateRequestState = {
  error: string | null;
  fieldErrors?: Partial<Record<string, string[]>>;
};

export async function createRequestAction(
  _prev: CreateRequestState,
  formData: FormData,
): Promise<CreateRequestState> {
  const mode = formData.get("mode") as string;
  const isAssembly = mode === "assembly";

  const raw = {
    mode,
    experienceType: formData.get("experienceType") as string,
    destination: (formData.get("destination") as string) ?? "",
    startDate: (formData.get("startDate") as string) ?? "",
    startTime: (formData.get("startTime") as string) || undefined,
    endTime: (formData.get("endTime") as string) || undefined,
    ...(isAssembly
      ? {
          groupSizeCurrent: Number(formData.get("groupSizeCurrent") ?? 1),
          groupMax: formData.get("groupMax") ? Number(formData.get("groupMax")) : undefined,
        }
      : {
          groupSize: Number(formData.get("groupSize") ?? 1),
        }),
    allowGuideSuggestionsOutsideConstraints:
      formData.get("allowGuideSuggestionsOutsideConstraints") === "true",
    budgetPerPersonRub: Number(formData.get("budgetPerPersonRub") ?? 0),
    notes: (formData.get("notes") as string) ?? "",
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
      error: "Supabase не настроен. Добавьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.",
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
      return { error: "Необходимо войти в систему для создания запроса." };
    }
    travelerId = user.id;
  } catch {
    return { error: "Ошибка авторизации. Попробуйте обновить страницу." };
  }

  let requestId: string;
  try {
    const isAss = input.mode === "assembly";
    const record = await createTravelerRequest(
      {
        destination: input.destination,
        category: input.experienceType,
        starts_on: input.startDate,
        ends_on: input.startDate,
        start_time: input.startTime || null,
        end_time: input.endTime || null,
        budget_minor: rubToKopecks(input.budgetPerPersonRub),
        participants_count: isAss ? (input.groupSizeCurrent ?? 1) : (input.groupSize ?? 1),
        format_preference: isAss ? "group" : "private",
        notes: input.notes || null,
        open_to_join: isAss,
        allow_guide_suggestions: input.allowGuideSuggestionsOutsideConstraints,
        group_capacity: isAss ? (input.groupMax ?? null) : null,
        region: null,
      },
      travelerId,
    );
    requestId = record.id;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Неизвестная ошибка при сохранении.";
    return { error: `Не удалось сохранить запрос: ${message}` };
  }

  redirect(`/traveler/requests/${requestId}?created=1&mode=${input.mode}`);
}
