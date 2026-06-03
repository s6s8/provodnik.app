/**
 * Moscow-anchored date/time helpers.
 * All "today" references use Europe/Moscow TZ — never UTC.
 */

const MOSCOW_TZ = "Europe/Moscow";

const MONTH_NAMES_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function parseISODateParts(value: string): { month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { month, day };
}

/**
 * Format one or two ISO date strings (YYYY-MM-DD) as Russian-locale ranges.
 * Examples:
 *   formatRussianDateRange("2026-05-15")            → "15 мая"
 *   formatRussianDateRange("2026-05-15", "2026-05-20") → "15 – 20 мая"
 *   formatRussianDateRange("2026-05-15", "2026-06-03") → "15 мая – 3 июня"
 */
export function formatRussianDateRange(startsOn: string, endsOn?: string | null): string {
  if (!startsOn) return "";
  const start = parseISODateParts(startsOn);
  if (!start) return "";
  const startMonth = MONTH_NAMES_RU[start.month - 1] ?? "";
  if (!endsOn || endsOn === startsOn) {
    return `${start.day} ${startMonth}`;
  }
  const end = parseISODateParts(endsOn);
  if (!end) {
    return `${start.day} ${startMonth}`;
  }
  const endMonth = MONTH_NAMES_RU[end.month - 1] ?? "";
  if (start.month === end.month) {
    return `${start.day} – ${end.day} ${endMonth}`;
  }
  return `${start.day} ${startMonth} – ${end.day} ${endMonth}`;
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

/**
 * Format a duration in minutes as a human-readable Russian string.
 * Examples:
 *   formatDurationMinutes(0)  → ""
 *   formatDurationMinutes(45) → "45 мин"
 *   formatDurationMinutes(60) → "1 ч"
 *   formatDurationMinutes(90) → "1 ч 30 мин"
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
