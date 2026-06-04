"use server";

import { getOpenRequests, makeError, type QueryResult, type RequestRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loadGuideInboxRequests(): Promise<QueryResult<RequestRecord[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    return await getOpenRequests(supabase);
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
