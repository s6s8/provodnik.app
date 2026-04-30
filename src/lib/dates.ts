/**
 * Moscow-anchored date/time helpers.
 * All "today" references use Europe/Moscow TZ — never UTC.
 */

const MOSCOW_TZ = "Europe/Moscow";

const MONTH_NAMES_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/**
 * Format one or two ISO date strings (YYYY-MM-DD) as Russian-locale ranges.
 * Examples:
 *   formatRussianDateRange("2026-05-15")            → "15 мая"
 *   formatRussianDateRange("2026-05-15", "2026-05-20") → "15 – 20 мая"
 *   formatRussianDateRange("2026-05-15", "2026-06-03") → "15 мая – 3 июня"
 */
export function formatRussianDateRange(startsOn: string, endsOn?: string | null): string {
  if (!startsOn) return "";
  const [, sm, sd] = startsOn.split("-").map(Number);
  const startMonth = MONTH_NAMES_RU[(sm ?? 1) - 1] ?? "";
  if (!endsOn || endsOn === startsOn) {
    return `${sd} ${startMonth}`;
  }
  const [, em, ed] = endsOn.split("-").map(Number);
  const endMonth = MONTH_NAMES_RU[(em ?? 1) - 1] ?? "";
  if (sm === em) {
    return `${sd} – ${ed} ${endMonth}`;
  }
  return `${sd} ${startMonth} – ${ed} ${endMonth}`;
}

/**
 * Format HH:MM time strings as a range.
 * Examples:
 *   formatTimeRange("10:00", "14:00") → "10:00 – 14:00"
 *   formatTimeRange("10:00")          → "10:00"
 *   formatTimeRange(null)             → ""
 */
export function formatTimeRange(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return "";
  if (!endTime) return startTime;
  return `${startTime} – ${endTime}`;
}

/**
 * Returns today's date in YYYY-MM-DD format anchored to Moscow TZ.
 * Use as the `min` attribute on date inputs — never use new Date().toISOString().slice(0,10).
 */
export function todayMoscowISODate(): string {
  return Intl.DateTimeFormat("en-CA", { timeZone: MOSCOW_TZ }).format(new Date());
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
