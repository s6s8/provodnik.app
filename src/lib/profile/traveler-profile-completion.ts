import type { TravelerProfile } from "@/lib/profile/types";

/** Stored traveler name from DB or demo cookie — not display fallbacks. */
export function hasTravelerProfileName(
  fullName: string | null | undefined,
): boolean {
  return Boolean(fullName?.trim());
}

export type TravelerProfileChecklistItem = {
  id: "name";
  label: string;
  complete: boolean;
};

export const TRAVELER_PROFILE_SECTION_2_TITLE = "Профиль путешественника";

export function getTravelerProfileSection2Checklist(
  profile: Pick<TravelerProfile, "full_name">,
): {
  sectionTitle: string;
  items: TravelerProfileChecklistItem[];
  complete: boolean;
} {
  const nameComplete = hasTravelerProfileName(profile.full_name);

  return {
    sectionTitle: TRAVELER_PROFILE_SECTION_2_TITLE,
    items: [
      {
        id: "name",
        label: "Имя путешественника",
        complete: nameComplete,
      },
    ],
    complete: nameComplete,
  };
}

/** Normal profile completion for section 2 — requires a stored traveler name. */
export function isTravelerProfileSection2Complete(
  profile: Pick<TravelerProfile, "full_name">,
): boolean {
  return getTravelerProfileSection2Checklist(profile).complete;
}
