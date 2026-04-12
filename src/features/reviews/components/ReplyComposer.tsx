"use client";

import * as React from "react";

import type { ReviewReplyRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  saveReplyDraft,
  submitReplyForReview,
} from "@/features/reviews/actions/submitReply";

type ReplyComposerProps = {
  reviewId: string;
  existingReply: ReviewReplyRow | null;
};

export function ReplyComposer({ reviewId, existingReply }: ReplyComposerProps) {
  const [reply, setReply] = React.useState<ReviewReplyRow | null>(existingReply);
  const [body, setBody] = React.useState(existingReply?.body ?? "");
  const [savedFlash, setSavedFlash] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"save" | "submit" | null>(null);

  const status = reply?.status ?? null;

  React.useEffect(() => {
    setReply(existingReply);
    setBody(existingReply?.body ?? "");
  }, [existingReply]);

  const runSave = React.useCallback(async () => {
    setError(null);
    setPending("save");
    setSavedFlash(false);
    try {
      const { id } = await saveReplyDraft(reviewId, body);
      setReply((prev) =>
        prev
          ? { ...prev, id, body, status: "draft" }
          : {
              id,
              review_id: reviewId,
              guide_id: "",
              body,
              status: "draft",
              submitted_at: null,
              published_at: null,
            },
      );
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить.");
    } finally {
      setPending(null);
    }
  }, [reviewId, body]);

  const runSubmit = React.useCallback(async () => {
    setError(null);
    setPending("submit");
    setSavedFlash(false);
    try {
      let replyId = reply?.id;
      if (!replyId) {
        const { id } = await saveReplyDraft(reviewId, body);
        replyId = id;
        setReply((prev) =>
          prev
            ? { ...prev, id, body, status: "draft" }
            : {
                id,
                review_id: reviewId,
                guide_id: "",
                body,
                status: "draft",
                submitted_at: null,
                published_at: null,
              },
        );
      }
      await submitReplyForReview(replyId);
      setReply((prev) =>
        prev
          ? {
              ...prev,
              status: "pending_review",
              submitted_at: new Date().toISOString(),
            }
          : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить.");
    } finally {
      setPending(null);
    }
  }, [reviewId, body, reply?.id]);

  if (status === "pending_review") {
    return (
      <div className="space-y-2 rounded-lg border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
        <p>Ответ на проверке у модератора</p>
      </div>
    );
  }

  if (status === "published") {
    return (
      <div className="space-y-3 rounded-lg border border-border/70 bg-card/60 p-4">
        <p className="text-sm font-medium text-foreground">Опубликованный ответ</p>
        <Separator />
        <p className="whitespace-pre-wrap text-sm text-foreground">{reply!.body}</p>
      </div>
    );
  }

  // No reply yet or draft
  return (
    <div className="space-y-3">
      {error !== null && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ваш ответ на отзыв"
        rows={5}
        className="resize-y"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() => void runSave()}
        >
          {pending === "save" ? "…" : "Сохранить черновик"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending !== null || !body.trim()}
          onClick={() => void runSubmit()}
        >
          {pending === "submit" ? "…" : "Отправить на проверку"}
        </Button>
      </div>
      {savedFlash && (
        <p className="text-sm text-muted-foreground">Черновик сохранён</p>
      )}
    </div>
  );
}
