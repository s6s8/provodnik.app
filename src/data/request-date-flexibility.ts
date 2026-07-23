export type DateFlexibility = "exact" | "few_days";

/** True when the traveler left dates (and time) open for guide proposals. */
export function isFlexibleDateFlexibility(
  value: string | null | undefined,
): value is "few_days" {
  return value != null && value !== "exact";
}

export type RequestFlexibilityPresentation = {
  datesFlexible: boolean;
  timeFlexible: boolean;
  timeLabel?: string;
};

function formatTimeLabel(startTime?: string | null, endTime?: string | null): string | undefined {
  if (!startTime) return undefined;
  return endTime ? `${startTime}–${endTime}` : startTime;
}

/**
 * Single presentation contract for request/offer surfaces: flexible dates always
 * pair with flexible time; fixed requests keep their clock range when present.
 */
export function resolveRequestFlexibilityPresentation(input: {
  dateFlexibility?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): RequestFlexibilityPresentation {
  const flexible = isFlexibleDateFlexibility(input.dateFlexibility);
  return {
    datesFlexible: flexible,
    timeFlexible: flexible,
    timeLabel: flexible ? undefined : formatTimeLabel(input.startTime, input.endTime),
  };
}

/** Guide surfaces also treat an unlocked time flag as flexible presentation. */
export function resolveGuideRequestFlexibilityPresentation(input: {
  dateFlexibility?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  time_locked?: boolean | null;
}): RequestFlexibilityPresentation {
  const base = resolveRequestFlexibilityPresentation(input);
  if (base.timeFlexible) return base;
  if (input.time_locked === false) {
    return {
      ...base,
      timeFlexible: true,
      timeLabel: undefined,
    };
  }
  return base;
}

export function isOfferDateLocked(request: { date_flexibility?: string | null }): boolean {
  return !isFlexibleDateFlexibility(request.date_flexibility);
}

/** Guide offer form: time lock follows date flexibility, then the stored lock flag. */
export function isOfferTimeLocked(request: {
  date_flexibility?: string | null;
  time_locked?: boolean | null;
}): boolean {
  if (isFlexibleDateFlexibility(request.date_flexibility)) return false;
  return request.time_locked ?? true;
}
