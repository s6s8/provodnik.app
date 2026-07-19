"use server";

import { getOpenRequests, makeError, type QueryResult, type RequestRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loadGuideInboxRequests(): Promise<QueryResult<RequestRecord[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Pass the guide's own id so requests addressed directly to them are included and
    // flagged (isDirectToViewer) — the trusted server signal for «Личный запрос вам».
    return await getOpenRequests(supabase, undefined, ["open"], {
      viewerGuideId: user?.id,
    });
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
