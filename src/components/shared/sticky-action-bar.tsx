"use client";

import { useRef, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConfirm, type ConfirmOptions } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";

type StickyActionBarProps = {
  avatarUrl?: string | null;
  name: string;
  metaLabel?: string;
  /** Secondary "ask a question" handler — omit to hide the secondary button. */
  onMessage?: () => void;
  messageLabel?: string;
  /** Optional dismissal — renders a ghost reject button when passed. */
  onReject?: () => void;
  rejectLabel?: string;
  /**
   * When provided, the primary action is gated behind a confirm dialog: the
   * primary control only fires after {@link useConfirm} resolves `true`.
   */
  confirmOptions?: ConfirmOptions;
  /** Primary commit control (e.g. the accept button). */
  primary: ReactNode;
  className?: string;
};

/**
 * Fixed bottom action bar revealed when a guide is selected. Canonical primitive.
 */
export function StickyActionBar({
  avatarUrl,
  name,
  metaLabel,
  onMessage,
  messageLabel = "Задать вопрос",
  onReject,
  rejectLabel = "Не подходит",
  confirmOptions,
  primary,
  className,
}: StickyActionBarProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const bypassRef = useRef(false);

  const handlePrimaryCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!confirmOptions || bypassRef.current) {
      bypassRef.current = false;
      return;
    }
    const trigger = (event.target as HTMLElement).closest<HTMLElement>(
      "button, a, [role='button']",
    );
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    void confirm(confirmOptions).then((confirmed) => {
      if (confirmed) {
        bypassRef.current = true;
        trigger.click();
      }
    });
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-lift backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex max-w-page items-center gap-4 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:px-8">
        <Avatar className="size-11 shrink-0 rounded-btn">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
          <AvatarFallback className="rounded-btn bg-surface-low font-semibold text-on-surface-muted">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-base font-bold tracking-[-0.01em] text-on-surface">
            {name}
          </div>
          {metaLabel ? (
            <div className="truncate text-xs text-on-surface-muted">{metaLabel}</div>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {onReject ? (
            <Button type="button" variant="ghost" onClick={onReject}>
              {rejectLabel}
            </Button>
          ) : null}
          {onMessage ? (
            <Button type="button" variant="outline" onClick={onMessage}>
              {messageLabel}
            </Button>
          ) : null}
          <div onClickCapture={handlePrimaryCapture} className="contents">
            {primary}
          </div>
        </div>
      </div>
      {ConfirmDialog}
    </div>
  );
}
