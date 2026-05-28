"use server";

import { findContactInBio } from "@/features/profile/validation/anti-contact";

export async function updateTravelerProfile(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bio = formData.get("bio")?.toString() ?? "";
  const contact = findContactInBio(bio);
  if (contact) {
    return {
      ok: false,
      error: `Контактные данные в «О себе» запрещены (${contact.kind}).`,
    };
  }
  return { ok: true };
}
