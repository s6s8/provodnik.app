import type { RequestRecord } from "@/data/supabase/queries";

export function formatGroupLine(req: Pick<RequestRecord, "mode" | "groupSize" | "capacity">): string {
  if (req.mode === "private") {
    return `Своя группа · ${req.groupSize} чел.`;
  }
  const remaining = req.capacity - req.groupSize;
  if (remaining <= 0) {
    return "Группа набрана";
  }
  return `Сборная группа · Свободно мест: ${remaining} из ${req.capacity}`;
}
