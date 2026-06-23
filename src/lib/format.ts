/** Canonical excursion-format + duration labels for Discovery surfaces. */
export function getFormatLabel(format: string | null): string | null {
  switch (format) {
    case "private": return "Частный";
    case "group": return "Групповой";
    case "combo": return "Смешанный";
    default: return null;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 480) return `${Math.round(minutes / 60)} ч.`;
  return `${Math.ceil(minutes / 480)} дн.`;
}
