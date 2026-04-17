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
  // Parse form values into the shape the Zod schema expects
  const raw = {
    experienceType: formData.get("experienceType") as string,
    destination: (formData.get("destination") as string) ?? "",
    startDate: (formData.get("startDate") as string) ?? "",
    endDate: (formData.get("endDate") as string) ?? "",
    groupSize: Number(formData.get("groupSize") ?? 1),
    groupPreference: formData.get("groupPreference") as string,
    openToJoiningOthers: formData.get("openToJoiningOthers") === "true",
    allowGuideSuggestionsOutsideConstraints:
      formData.get("allowGuideSuggestionsOutsideConstraints") === "true",
    budgetPerPersonRub: Number(formData.get("budgetPerPersonRub") ?? 0),
    notes: (formData.get("notes") as string) ?? "",
  };

  // Validate with the shared schema
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

  // Require Supabase env
  if (!hasSupabaseEnv()) {
    return {
      error: "Supabase не настроен. Добавьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  // Get the authenticated user from the server context
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

  // Persist to Supabase
  let requestId: string;
  try {
    const record = await createTravelerRequest(
      {
        destination: input.destination,
        category: input.experienceType,
        starts_on: input.startDate,
        ends_on: input.endDate,
        budget_minor: rubToKopecks(input.budgetPerPersonRub),
        participants_count: input.groupSize,
        format_preference: input.groupPreference,
        notes: input.notes || null,
        open_to_join: input.openToJoiningOthers,
        allow_guide_suggestions: input.allowGuideSuggestionsOutsideConstraints,
        group_capacity:
          input.groupPreference === "group" ? input.groupSize : null,
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

  // Redirect after successful creation — must be outside try/catch
  redirect(`/traveler/requests/${requestId}`);
}
