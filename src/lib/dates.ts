/**
 * Moscow-anchored date/time helpers.
 * All "today" references use Europe/Moscow TZ — never UTC.
 */

const MOSCOW_TZ = "Europe/Moscow";

const MONTH_NAMES_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const MOSCOW_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: MOSCOW_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Reduce a value to a plain YYYY-MM-DD calendar day.
 *
 * Date-only inputs (traveler_requests.starts_on) carry no zone and pass through.
 * Timestamps (bookings.starts_at, guide_offers.starts_at) are resolved to their
 * Moscow calendar day, so the date can never contradict formatRussianTime,
 * which prints the Moscow clock.
 */
export function toMoscowCalendarDay(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return MOSCOW_DATE_FORMAT.format(parsed);
}

function parseISODateParts(value: string): { month: number; day: number } | null {
  const calendarDay = toMoscowCalendarDay(value);
  if (!calendarDay) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDay);
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
 * Format one or two ISO dates (YYYY-MM-DD) or timestamps as Russian-locale ranges.
 * Timestamps are read as their Moscow calendar day.
 * Examples:
 *   formatRussianDateRange("2026-05-15")            → "15 мая"
 *   formatRussianDateRange("2026-05-15", "2026-05-20") → "15 – 20 мая"
 *   formatRussianDateRange("2026-05-15", "2026-06-03") → "15 мая – 3 июня"
 *   formatRussianDateRange("2026-05-15T07:00:00Z", "2026-05-15T11:00:00Z") → "15 мая"
 */
export function formatRussianDateRange(startsOn: string, endsOn?: string | null): string {
  if (!startsOn) return "";
  const start = parseISODateParts(startsOn);
  if (!start) return "";
  const startMonth = MONTH_NAMES_RU[start.month - 1] ?? "";
  const end = endsOn ? parseISODateParts(endsOn) : null;
  // Same calendar day (a one-day tour with start/end timestamps) reads as one date.
  if (!end || (end.month === start.month && end.day === start.day)) {
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
 * Interpret a user-entered expiry value as an ISO timestamp.
 *
 * A date-only `YYYY-MM-DD` — what `<input type="date">` produces — means the END of
 * that calendar day in Moscow: "действует до 25 июля" stays valid all of the 25th.
 * `new Date("2026-07-25")` instead pins UTC midnight = 03:00 MSK, which killed the
 * offer 21 hours early and made "today" unselectable. Moscow is a fixed UTC+3 (no
 * DST since 2014), the same offset the rest of this codebase assumes.
 *
 * Anything else parseable passes through as its ISO form; unparseable → null.
 */
export function normalizeExpiryInput(value: string): string | null {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  // `new Date("2026-02-30T…+03:00")` silently rolls over to 2 March; parseISODateParts rejects it.
  if (dateOnly && !parseISODateParts(value)) return null;
  const parsed = new Date(dateOnly ? `${value}T23:59:59.999+03:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * True once an expiry timestamp is at or before now. Mirrors the `expires_at <= now()`
 * gate in the accept_offer RPC so the UI stops short of a guaranteed RPC failure.
 * A missing expiry never expires.
 */
export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time <= Date.now();
}

/**
 * Format an ISO timestamp/date as a Russian "day month" string, pinned to Moscow TZ.
 * Pinning the timeZone keeps SSR (UTC) and client output identical — avoids hydration #418.
 */
export function formatRussianDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: MOSCOW_TZ,
  }).format(new Date(iso));
}

/**
 * Format an ISO timestamp as a Russian "day month, HH:MM" string, pinned to Moscow TZ.
 */
export function formatRussianDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MOSCOW_TZ,
  }).format(new Date(iso));
}

/**
 * Format an ISO timestamp as a Russian "HH:MM" time string, pinned to Moscow TZ.
 */
export function formatRussianTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MOSCOW_TZ,
  }).format(new Date(iso));
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
