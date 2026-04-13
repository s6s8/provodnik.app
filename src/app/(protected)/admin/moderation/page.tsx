import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ModerationQueueList } from "@/features/admin/components/ModerationQueueItem";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Очередь модерации",
};

export default async function ModerationQueuePage() {
  const supabase = await createSupabaseServerClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, region, exp_type, guide_id, description, created_at, status")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: replies } = await supabase
    .from("review_replies")
    .select("id, review_id, body, submitted_at")
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true })
    .limit(20);

  const listingRows = listings ?? [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Очередь модерации</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">
          Объявления ({listingRows.length})
        </h2>
        {listingRows.length === 0 ? (
          <p className="text-muted-foreground">Нет объявлений на проверке</p>
        ) : (
          <ModerationQueueList listings={listingRows} />
        )}
      </section>

      {replies && replies.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Ответы на отзывы ({replies.length})
          </h2>
          <div className="space-y-2">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="flex items-start gap-4 rounded-card border border-border p-4"
              >
                <p className="line-clamp-2 flex-1 text-sm">{reply.body}</p>
                <Badge variant="secondary">На проверке</Badge>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
