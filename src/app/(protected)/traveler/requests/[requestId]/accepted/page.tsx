import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Предложение принято!",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default async function TravelerRequestAcceptedPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ booking_id?: string; guide_id?: string }>;
}) {
  const { requestId } = await params;
  const { booking_id, guide_id } = await searchParams;

  if (!booking_id) {
    redirect(`/traveler/requests/${requestId}`);
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, guide_id, starts_at, total_price_minor, status")
    .eq("id", booking_id)
    .maybeSingle();

  if (!booking) {
    redirect("/traveler/requests");
  }

  let guideName = "Гид";
  let guideAvatarUrl: string | null = null;

  if (guide_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", guide_id)
      .maybeSingle();
    if (profile?.full_name) guideName = profile.full_name;
    if (profile?.avatar_url) guideAvatarUrl = profile.avatar_url;
  }

  const { data: request } = await supabase
    .from("traveler_requests")
    .select("id, destination, starts_on")
    .eq("id", requestId)
    .maybeSingle();

  const tripDateLabel = request?.starts_on ? formatDate(request.starts_on) : null;

  const guideInitials = guideName
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-[480px] flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-9 text-green-600" strokeWidth={1.8} />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold text-foreground">
            Предложение принято!
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Вы выбрали {guideName}! Гид получил уведомление и скоро подтвердит
            встречу.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Avatar className="size-20 border-2 border-green-200">
            {guideAvatarUrl ? (
              <AvatarImage src={guideAvatarUrl} alt={guideName} />
            ) : null}
            <AvatarFallback className="bg-green-50 text-lg font-semibold text-green-700">
              {guideInitials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-foreground">{guideName}</p>
        </div>

        <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
          {tripDateLabel ? `Поездка: ${tripDateLabel}` : "Дата уточняется"}
        </div>

        <hr className="w-full border-border/60" />

        <div className="flex w-full flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href={`/traveler/bookings/${booking_id}`}>Отлично</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/traveler/requests">К моим запросам</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

