import { redirect } from "next/navigation";

import { createQuickRequestAction } from "./actions";

export default async function QuickRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    destination?: string;
    duration?: string;
    companion?: string;
    customStart?: string;
    customEnd?: string;
  }>;
}) {
  const params = await searchParams;

  if (!params.destination) {
    redirect("/");
  }

  const fd = new FormData();
  fd.set("destination", params.destination);
  if (params.duration) fd.set("duration", params.duration);
  if (params.companion) fd.set("companion", params.companion);
  if (params.customStart) fd.set("customStart", params.customStart);
  if (params.customEnd) fd.set("customEnd", params.customEnd);

  // On success: createQuickRequestAction throws NEXT_REDIRECT to sent screen.
  // On error: returns { error } — redirect home with error param.
  const result = await createQuickRequestAction({ error: null }, fd);

  if (result?.error) {
    redirect(`/?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/traveler/requests");
}
