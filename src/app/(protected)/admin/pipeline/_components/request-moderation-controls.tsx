"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  blockTravelerRequestAction,
  deleteTravelerRequestAction,
  unblockTravelerRequestAction,
  type AdminRequestActionResult,
} from "../actions";

type RequestModerationState = {
  requestId: string;
  status: string;
  isBlocked: boolean;
  isDeleted: boolean;
};

function ResultAlert({ result }: { result: AdminRequestActionResult | null }) {
  if (!result) return null;
  return (
    <Alert role={result.ok ? "status" : "alert"} variant={result.ok ? "success" : "destructive"}>
      <AlertDescription>{result.ok ? result.message : result.error}</AlertDescription>
    </Alert>
  );
}

function ReasonDialog({
  title,
  description,
  confirmLabel,
  variant,
  disabled,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "destructive" | "default";
  disabled?: boolean;
  onConfirm: (reason: string) => Promise<AdminRequestActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<AdminRequestActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setReason("");
      setResult(null);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size="sm" disabled={disabled || isPending}>
          {confirmLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`reason-${title}`}>Причина</Label>
          <Textarea
            id={`reason-${title}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Кратко опишите причину для журнала аудита"
            rows={3}
            required
          />
        </div>
        <ResultAlert result={result} />
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isPending}>
            Отмена
          </AlertDialogCancel>
          <Button
            type="button"
            variant={variant}
            disabled={isPending || reason.trim().length < 3}
            onClick={() => {
              startTransition(async () => {
                const next = await onConfirm(reason);
                setResult(next);
                if (next.ok) {
                  handleOpenChange(false);
                  router.refresh();
                }
              });
            }}
          >
            {isPending ? "Выполняем…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => Promise<AdminRequestActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<AdminRequestActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setResult(null);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled || isPending}>
          <RotateCcw className="size-4" />
          {confirmLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <ResultAlert result={result} />
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isPending}>
            Отмена
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const next = await onConfirm();
                setResult(next);
                if (next.ok) {
                  handleOpenChange(false);
                  router.refresh();
                }
              });
            }}
          >
            {isPending ? "Выполняем…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RequestModerationControls({ state }: { state: RequestModerationState }) {
  const canBlock = state.status === "open" && !state.isBlocked && !state.isDeleted;
  const canUnblock = state.status === "open" && state.isBlocked && !state.isDeleted;
  const canDelete = !state.isDeleted;

  if (!canBlock && !canUnblock && !canDelete) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {canBlock ? (
        <ReasonDialog
          title="Заблокировать запрос?"
          description="Запрос исчезнет из каталога, ленты гидов и поиска. Новые отклики и присоединения будут отклонены. Владелец по-прежнему увидит запрос в кабинете."
          confirmLabel="Заблокировать"
          variant="default"
          onConfirm={(reason) => blockTravelerRequestAction(state.requestId, reason)}
        />
      ) : null}
      {canUnblock ? (
        <ConfirmDialog
          title="Разблокировать запрос?"
          description="Запрос снова станет виден в каталоге и снова примет отклики гидов и присоединения путешественников. Доступно только для изначально открытых запросов."
          confirmLabel="Разблокировать"
          onConfirm={() => unblockTravelerRequestAction(state.requestId)}
        />
      ) : null}
      {canDelete ? (
        <ReasonDialog
          title="Удалить запрос из каталога?"
          description="Мягкое удаление: строка и журнал аудита сохраняются, подтверждённые брони не отменяются. Запрос исчезнет из всех публичных поверхностей."
          confirmLabel="Удалить"
          variant="destructive"
          onConfirm={(reason) => deleteTravelerRequestAction(state.requestId, reason)}
        />
      ) : null}
      {state.isBlocked ? (
        <span className="inline-flex items-center gap-1 text-xs text-ink-2">
          <Ban className="size-3.5" />
          Заблокирован
        </span>
      ) : null}
      {state.isDeleted ? (
        <span className="inline-flex items-center gap-1 text-xs text-destructive">
          <Trash2 className="size-3.5" />
          Удалён
        </span>
      ) : null}
    </div>
  );
}
