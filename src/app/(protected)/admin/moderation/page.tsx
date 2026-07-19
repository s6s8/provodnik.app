import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModerationQueueList } from "@/features/admin/components/ModerationQueueItem";
import { ReplyModerationList } from "@/features/admin/components/ReplyModerationItem";
import {
  TemplateModerationList,
  type TemplateModerationRow,
} from "@/features/admin/components/TemplateModerationItem";
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

  const { data: templates } = await adminClient
    .from("guide_templates")
    .select(
      "id, title, region, description, price_from_kopecks, price_scope, max_participants, created_at",
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(50);

  const listingRows = listings ?? [];
  const replyRows = replies ?? [];
  const templateRows = (templates ?? []) as TemplateModerationRow[];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Администрирование"
        title="Очередь модерации"
        subtitle="Контент, ожидающий проверки перед публикацией: экскурсии гидов и ответы на отзывы."
      />

      <Tabs defaultValue="tours">
        <TabsList>
          <TabsTrigger value="tours">
            Готовые экскурсии
            <Badge variant="secondary">{templateRows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="listings">
            Объявления
            <Badge variant="secondary">{listingRows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="replies">
            Ответы на отзывы
            <Badge variant="secondary">{replyRows.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tours">
          {templateRows.length === 0 ? (
            <EmptyState
              title="Очередь пуста"
              description="Нет готовых экскурсий на проверке."
            />
          ) : (
            <TemplateModerationList templates={templateRows} />
          )}
        </TabsContent>

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
