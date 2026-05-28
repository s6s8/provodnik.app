"use server";

// Step A scaffold — real validation lands in Task 14.
export async function updateTravelerProfile(
  _formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: true };
}
