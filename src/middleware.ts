import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { supabase, applyCookies } = createSupabaseMiddlewareClient(request);
  // Refresh session if expired — required for Server Actions to see a valid auth.uid()
  await supabase.auth.getUser();
  return applyCookies(response);
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
