import { cookies } from "next/headers";

import type { TravelerProfile } from "@/lib/profile/types";

export const DEMO_TRAVELER_PROFILE_COOKIE = "provodnik_demo_traveler_profile";

export type DemoTravelerProfilePayload = Pick<
  TravelerProfile,
  "full_name" | "bio" | "home_city" | "languages" | "birth_year"
>;

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function parseDemoTravelerProfileCookieValue(
  value: string | undefined,
): DemoTravelerProfilePayload | null {
  if (!value) return null;
  const decodedValue = safeDecodeURIComponent(value);
  if (!decodedValue) return null;
  const decoded = safeJsonParse(decodedValue);
  if (!decoded || typeof decoded !== "object") return null;

  const row = decoded as Record<string, unknown>;
  const fullName = row.full_name;
  const bio = row.bio;
  const homeCity = row.home_city;
  const languages = row.languages;
  const birthYear = row.birth_year;

  if (fullName !== null && fullName !== undefined && typeof fullName !== "string") {
    return null;
  }
  if (bio !== null && bio !== undefined && typeof bio !== "string") return null;
  if (homeCity !== null && homeCity !== undefined && typeof homeCity !== "string") {
    return null;
  }
  if (birthYear !== null && birthYear !== undefined && typeof birthYear !== "number") {
    return null;
  }
  if (languages !== null && languages !== undefined) {
    if (!Array.isArray(languages) || languages.some((item) => typeof item !== "string")) {
      return null;
    }
  }

  return {
    full_name: (fullName as string | null | undefined) ?? null,
    bio: (bio as string | null | undefined) ?? null,
    home_city: (homeCity as string | null | undefined) ?? null,
    languages: (languages as string[] | null | undefined) ?? null,
    birth_year: (birthYear as number | null | undefined) ?? null,
  };
}

export function serializeDemoTravelerProfileCookieValue(
  profile: DemoTravelerProfilePayload,
): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export async function readDemoTravelerProfileFromCookies(): Promise<DemoTravelerProfilePayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEMO_TRAVELER_PROFILE_COOKIE)?.value;
  return parseDemoTravelerProfileCookieValue(value);
}

export async function writeDemoTravelerProfileToCookies(
  profile: DemoTravelerProfilePayload,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_TRAVELER_PROFILE_COOKIE, serializeDemoTravelerProfileCookieValue(profile), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}
