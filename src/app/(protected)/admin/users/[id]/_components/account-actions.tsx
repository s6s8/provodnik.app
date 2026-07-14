"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  HARD_DELETE_CONFIRM_TEXT,
  ROLE_LABELS,
  type AccountStatus,
  type AdminActionResult,
} from "@/data/admin-users";
import type { AppRole } from "@/lib/auth/types";

import {
  approveGuideAction,
  hardDeleteDemoUserAction,
  rejectGuideAction,
  setAccountStatusAction,
  setUserRoleAction,
  updateFullNameAction,
} from "../../actions";

function ResultLine({ result }: { result: AdminActionResult | null }) {
  if (!result) return null;
  return (
    <Alert
      role={result.ok ? "status" : "alert"}
      variant={result.ok ? "success" : "destructive"}
    >
      <AlertDescription>
        {result.ok ? result.message : result.error}
      </AlertDescription>
    </Alert>
  );
}

function useRefreshOnSuccess(result: AdminActionResult | null) {
  const router = useRouter();
  useEffect(() => {
    if (result?.ok) router.refresh();
  }, [result, router]);
}

// --- Status ---------------------------------------------------------------

function StatusActionDialog({
  userId,
  status,
  label,
  variant,
  requireReason,
}: {
  userId: string;
  status: AccountStatus;
  label: string;
  variant: "destructive" | "default" | "outline";
  requireReason: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await setAccountStatusAction(_prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );
  useRefreshOnSuccess(state);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm">
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Submit stays a plain Button so native form validation on the reason runs
            before the dialog closes — AlertDialogAction would close it regardless. */}
        <form action={action}>
          <input type="hidden" name="targetUserId" value={userId} />
          <input type="hidden" name="status" value={status} />
          <AlertDialogHeader>
            <AlertDialogTitle>{label}</AlertDialogTitle>
            <AlertDialogDescription>
              {requireReason
                ? "Укажите причину — она попадёт в журнал аудита."
                : "Подтвердите изменение статуса аккаунта."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor={`reason-${status}`}>
              Причина{requireReason ? " (обязательно)" : " (необязательно)"}
            </Label>
            <Textarea
              id={`reason-${status}`}
              name="reason"
              required={requireReason}
              placeholder="Например: нарушение правил, тест, очистка демо-данных"
            />
            <ResultLine result={state} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Отмена</AlertDialogCancel>
            <Button type="submit" variant={variant} disabled={pending} loading={pending}>
              Подтвердить
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function StatusControls({
  userId,
  status,
}: {
  userId: string;
  status: AccountStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "active" ? (
        <StatusActionDialog
          userId={userId}
          status="active"
          label="Активировать"
          variant="default"
          requireReason={false}
        />
      ) : null}
      {status !== "suspended" ? (
        <StatusActionDialog
          userId={userId}
          status="suspended"
          label="Заблокировать"
          variant="destructive"
          requireReason
        />
      ) : null}
      {status !== "archived" ? (
        <StatusActionDialog
          userId={userId}
          status="archived"
          label="В архив"
          variant="outline"
          requireReason
        />
      ) : null}
    </div>
  );
}

// --- Full name (private) ---------------------------------------------------

export function FullNameControls({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string | null;
}) {
  const [value, setValue] = useState(fullName ?? "");
  const [state, action, pending] = useActionState<AdminActionResult | null, FormData>(
    async (_prev, formData) => updateFullNameAction(_prev, formData),
    null,
  );
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="targetUserId" value={userId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="full-name" className="text-xs text-muted-foreground">
          ФИО полностью
        </Label>
        <Input
          id="full-name"
          name="fullName"
          required
          maxLength={120}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Иван Сергеевич Петров"
        />
      </div>
      <ResultLine result={state} />
      <Button
        type="submit"
        className="self-start"
        disabled={pending || value.trim() === (fullName ?? "").trim()}
        loading={pending}
      >
        Сохранить ФИО
      </Button>
    </form>
  );
}

// --- Role -----------------------------------------------------------------

export function RoleControls({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: AppRole;
}) {
  const [role, setRole] = useState<AppRole>(currentRole);
  const [state, action, pending] = useActionState<AdminActionResult | null, FormData>(
    async (_prev, formData) => setUserRoleAction(_prev, formData),
    null,
  );
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="targetUserId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="role-select" className="text-xs text-muted-foreground">
            Роль
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger id="role-select" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as AppRole[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {ROLE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="role-reason" className="text-xs text-muted-foreground">
          Причина (обязательно)
        </Label>
        <Textarea id="role-reason" name="reason" required placeholder="Причина смены роли" />
      </div>
      <ResultLine result={state} />
      <Button
        type="submit"
        className="self-start"
        disabled={pending || role === currentRole}
        loading={pending}
      >
        Сменить роль
      </Button>
    </form>
  );
}

// --- Guide verification ----------------------------------------------------

export function GuideVerificationControls({ guideId }: { guideId: string }) {
  const [approveState, approve, approvePending] = useActionState<AdminActionResult | null, FormData>(
    async (prev) => approveGuideAction(guideId, prev),
    null,
  );
  const [rejectState, reject, rejectPending] = useActionState<AdminActionResult | null, FormData>(
    async (prev, formData) => rejectGuideAction(guideId, prev, formData),
    null,
  );
  useRefreshOnSuccess(approveState);
  useRefreshOnSuccess(rejectState);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <form action={approve}>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={approvePending || rejectPending}
            loading={approvePending}
          >
            Одобрить анкету
          </Button>
        </form>

        <Separator className="my-1" />

        <form action={reject} className="flex flex-1 flex-wrap items-end gap-2">
          <div className="flex min-w-48 flex-1 flex-col gap-1">
            <Label htmlFor="reject-reason" className="text-xs text-muted-foreground">
              Причина отклонения (необязательно)
            </Label>
            <Textarea id="reject-reason" name="reason" rows={2} />
          </div>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={approvePending || rejectPending}
            loading={rejectPending}
          >
            Отклонить
          </Button>
        </form>
      </div>
      <ResultLine result={approveState ?? rejectState} />
    </div>
  );
}

// --- Danger zone: demo-only hard delete ------------------------------------

export function HardDeleteControl({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<AdminActionResult | null, FormData>(
    async (_prev, formData) => hardDeleteDemoUserAction(_prev, formData),
    null,
  );
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) router.push("/admin/users");
  }, [state, router]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Удалить демо-аккаунт
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={action}>
          <input type="hidden" name="targetUserId" value={userId} />
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить демо-аккаунт безвозвратно?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Доступно только для демо-аккаунтов. Введите{" "}
              «{HARD_DELETE_CONFIRM_TEXT}» и укажите причину.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="confirmText">Подтверждение</Label>
              <Input
                id="confirmText"
                name="confirmText"
                required
                placeholder={HARD_DELETE_CONFIRM_TEXT}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="delete-reason">Причина (обязательно)</Label>
              <Textarea id="delete-reason" name="reason" required rows={2} />
            </div>
            <ResultLine result={state} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Отмена</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending} loading={pending}>
              Удалить навсегда
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
