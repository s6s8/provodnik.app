import type { ExtractedFields } from "./extraction";

export type ParseResponse = {
  fields: ExtractedFields;
  missingRequired: string[];
  complete: boolean;
  assistantMessage: string | null;
  llmError?: boolean;
};

/** Client-side call to the server parse route. Throws with a friendly message on failure. */
export async function parseRequestText(args: {
  userText: string;
  accumulatedFields: ExtractedFields;
  todayMoscow: string;
}): Promise<ParseResponse> {
  const res = await fetch("/api/requests/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  const data = (await res.json().catch(() => null)) as ParseResponse | { error?: string } | null;

  if (!res.ok || !data || !("fields" in data)) {
    const message =
      (data && "error" in data && data.error) ||
      "Не удалось обработать сообщение. Попробуйте ещё раз.";
    throw new Error(message);
  }

  return data;
}
