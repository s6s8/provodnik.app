import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModerationQueueList } from "@/features/admin/components/ModerationQueueItem";
import { ReplyModerationList } from "@/features/admin/components/ReplyModerationItem";
import { requireAdminSession } from "@/lib/supabase/moderation";

export const metadata: Metadata = {
  title: "Очередь модерации",
};

export default async function ModerationQueuePage() {
  const { adminClient } = await requireAdminSession();

  const { data: listings } = await adminClient
    .from("listings")
    .select("id, title, region, exp_type, guide_id, description, created_at, status")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: replies } = await adminClient
    .from("review_replies")
    .select("id, review_id, body, submitted_at")
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true })
    .limit(20);

  const listingRows = listings ?? [];
  const replyRows = replies ?? [];

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        eyebrow="Администрирование"
        title="Очередь модерации"
        subtitle="Контент, ожидающий проверки перед публикацией: объявления гидов и ответы на отзывы."
      />

      <Tabs defaultValue="listings" className="mt-8">
        <TabsList>
          <TabsTrigger value="listings">
            Объявления
            <Badge variant="secondary">{listingRows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="replies">
            Ответы на отзывы
            <Badge variant="secondary">{replyRows.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          {listingRows.length === 0 ? (
            <EmptyState
              title="Очередь пуста"
              description="Нет объявлений на проверке."
            />
          ) : (
            <ModerationQueueList listings={listingRows} />
          )}
        </TabsContent>

        <TabsContent value="replies">
          {replyRows.length === 0 ? (
            <EmptyState
              title="Очередь пуста"
              description="Нет ответов на отзывы на проверке."
            />
          ) : (
            <ReplyModerationList replies={replyRows} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
