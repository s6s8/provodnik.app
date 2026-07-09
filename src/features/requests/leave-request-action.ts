"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { friendlyError } from "@/lib/errors";
import { isRequestMember, leaveRequest } from "@/lib/supabase/request-members";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Uuid } from "@/lib/supabase/types";

export type LeaveRequestResult = {
  error: string | null;
  left?: boolean;
};

export async function leaveRequestAction(
  requestId: string,
): Promise<LeaveRequestResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(buildAuthLoginRedirect(`/requests/${requestId}`));
  }

  const travelerId = user.id as unknown as Uuid;
  const requestUuid = requestId as unknown as Uuid;

  // Only members can leave; anything else is a no-op success.
  const member = await isRequestMember(requestUuid, travelerId);
  if (!member) {
    return { error: null, left: true };
  }

  try {
    await leaveRequest(requestUuid, travelerId);
  } catch (err) {
    return { error: friendlyError(err, "Не удалось покинуть группу.") };
  }

  revalidatePath(`/requests/${requestId}`);
  return { error: null, left: true };
}
