"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListRow } from "@/components/shared/list-row";
import { cn } from "@/lib/utils";
import {
  approveGuideTemplate,
  rejectGuideTemplate,
} from "@/features/admin/actions/moderateGuideTemplate";
import { formatExcursionPriceFrom } from "@/components/listing-detail/excursion-price";
import { formatRussianDateTime } from "@/lib/dates";

export type TemplateModerationRow = {
  id: string;
  title: string;
  region: string | null;
  description: string | null;
  price_from_kopecks: number | null;
  price_scope: "per_person" | "per_group";
  max_participants: number | null;
  created_at: string;
};

export function TemplateModerationList({ templates }: { templates: TemplateModerationRow[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      {templates.map((template) => (
        <TemplateModerationItem
          key={template.id}
          template={template}
          onAction={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function TemplateModerationItem({
  template,
  onAction,
}: {
  template: TemplateModerationRow;
  onAction: () => void;
}) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const priceLabel =
    template.price_from_kopecks != null
      ? formatExcursionPriceFrom(
          template.price_from_kopecks,
          template.price_scope === "per_group" ? "private" : "group",
          template.max_participants,
        )
      : null;
  const subtitle = [template.region, priceLabel].filter(Boolean).join(" · ");

  async function handleApprove() {
    setError(null);
    setBusy(true);
    try {
      await approveGuideTemplate(template.id);
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось одобрить");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReject() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Укажите причину отклонения");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await rejectGuideTemplate(template.id, trimmed);
      setRejectOpen(false);
      setReason("");
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отклонить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <ListRow
        title={template.title}
        subtitle={subtitle}
        badge={
          <div className="flex items-center gap-2">
            <Badge>На проверке</Badge>
            <span className="text-xs text-muted-foreground">
              {formatRussianDateTime(template.created_at)}
            </span>
          </div>
        }
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant="success"
              loading={busy}
              disabled={busy}
              onClick={() => void handleApprove()}
            >
              Одобрить
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Ещё действия"
                  disabled={busy}
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    setError(null);
                    setRejectOpen(true);
                  }}
                >
                  Отклонить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {error && !rejectOpen ? (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setReason("");
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить экскурсию</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите причину — гид увидит её в своём кабинете.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {template.description ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{template.description}</p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`reject-tpl-${template.id}`}>Причина отклонения</Label>
            <Textarea
              id={`reject-tpl-${template.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Текст причины…"
              rows={4}
            />
          </div>

          {error ? (
            <Alert role="alert" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmReject();
              }}
            >
              Подтвердить отклонение
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
