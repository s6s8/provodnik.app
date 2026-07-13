"use client";

import { useActionState, useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search,
  SquareArrowOutUpRight,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatRussianDateTime } from "@/lib/dates";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABELS,
  GUIDE_TYPES,
  GUIDE_TYPE_LABELS,
  GUIDE_VERIFICATION_LABELS,
  GUIDE_VERIFICATION_STATUSES,
  ROLE_LABELS,
  type BulkAction,
  type BulkActionResult,
} from "@/data/admin-users";
import type { AdminUserListItem } from "@/lib/supabase/admin-users";

import { approveGuideAction, bulkAction } from "../actions";
import {
  AccountStatusBadge,
  GuideStatusBadge,
  MissingPhoneBadge,
  RoleBadge,
} from "./user-badges";

const ALL = "__all__";

type Filters = {
  q?: string;
  role?: string;
  status?: string;
  guideStatus?: string;
  guideType?: string;
  demo?: string;
};

const BULK_LABELS: Record<BulkAction, string> = {
  approve: "Одобрить гидов",
  suspend: "Заблокировать",
  reactivate: "Активировать",
  archive: "В архив",
};

const BULK_NEEDS_REASON: Record<BulkAction, boolean> = {
  approve: false,
  suspend: true,
  reactivate: false,
  archive: true,
};

export function UsersConsole({
  items,
  total,
  page,
  pageCount,
  filters,
}: {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageCount: number;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filters.q ?? "");
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);
  const [reason, setReason] = useState("");
  const [rowPending, startRow] = useTransition();

  const [bulkState, runBulk, bulkPending] = useActionState<BulkActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await bulkAction(_prev, formData);
      setPendingBulk(null);
      if (result.applied > 0) {
        setSelected(new Set());
        router.refresh();
      }
      return result;
    },
    null,
  );

  const allOnPageSelected = items.length > 0 && items.every((it) => selected.has(it.id));

  function updateParam(next: Partial<Filters>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === ALL) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParam({ q: search.trim() || undefined });
  }

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allOnPageSelected) return new Set();
      const nextSet = new Set(prev);
      items.forEach((it) => nextSet.add(it.id));
      return nextSet;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  const selectedIds = useMemo(() => [...selected], [selected]);

  function openBulk(action: BulkAction) {
    setReason("");
    setPendingBulk(action);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="bg-surface-high rounded-card shadow-card flex flex-col gap-4 p-4 sm:p-5">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Имя или email"
              className="pl-9"
              aria-label="Поиск пользователей"
            />
          </div>
          <Button type="submit" variant="outline">
            Найти
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <FilterSelect
            label="Роль"
            value={filters.role ?? ALL}
            onChange={(v) => updateParam({ role: v })}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            label="Статус"
            value={filters.status ?? ALL}
            onChange={(v) => updateParam({ status: v })}
            options={ACCOUNT_STATUSES.map((value) => ({
              value,
              label: ACCOUNT_STATUS_LABELS[value],
            }))}
          />
          <FilterSelect
            label="Гид: проверка"
            value={filters.guideStatus ?? ALL}
            onChange={(v) => updateParam({ guideStatus: v })}
            options={GUIDE_VERIFICATION_STATUSES.map((value) => ({
              value,
              label: GUIDE_VERIFICATION_LABELS[value],
            }))}
          />
          <FilterSelect
            label="Тип гида"
            value={filters.guideType ?? ALL}
            onChange={(v) => updateParam({ guideType: v })}
            options={GUIDE_TYPES.map((value) => ({ value, label: GUIDE_TYPE_LABELS[value] }))}
          />
          <FilterSelect
            label="Демо"
            value={filters.demo ?? ALL}
            onChange={(v) => updateParam({ demo: v })}
            options={[
              { value: "demo", label: "Демо-аккаунты" },
              { value: "real", label: "Реальные" },
            ]}
          />
        </div>
      </div>

      {/* Bulk toolbar */}
      {selected.size > 0 ? (
        <div className="bg-brand-light text-brand flex flex-col gap-3 rounded-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">Выбрано: {selected.size}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BULK_LABELS) as BulkAction[]).map((action) => (
              <Button
                key={action}
                size="sm"
                variant={action === "suspend" || action === "archive" ? "destructive" : "outline"}
                onClick={() => openBulk(action)}
              >
                {BULK_LABELS[action]}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Сбросить
            </Button>
          </div>
        </div>
      ) : null}

      {bulkState ? (
        <Alert variant={bulkState.ok ? "success" : "default"}>
          <AlertDescription>{bulkState.message}</AlertDescription>
        </Alert>
      ) : null}

      {/* Table */}
      {items.length === 0 ? (
        <div className="rounded-card border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground shadow-card">
          Пользователи не найдены. Измените фильтры или запрос.
        </div>
      ) : (
        <div className="bg-surface-high rounded-card shadow-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Выбрать всех на странице"
                  />
                </TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead className="hidden sm:table-cell">Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="hidden lg:table-cell">Гид</TableHead>
                <TableHead className="hidden xl:table-cell">Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id} data-state={selected.has(user.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(user.id)}
                      onCheckedChange={() => toggleOne(user.id)}
                      aria-label={`Выбрать ${user.fullName ?? user.maskedEmail}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-ink hover:text-brand hover:underline"
                      >
                        {user.fullName?.trim() || "Без имени"}
                      </Link>
                      <span className="text-xs text-muted-foreground">{user.email ?? user.maskedEmail}</span>
                      <span className="mt-1 flex gap-1.5 sm:hidden">
                        <RoleBadge role={user.role} />
                        {user.isDemo ? (
                          <span className="text-xs text-muted-foreground">демо</span>
                        ) : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <RoleBadge role={user.role} />
                      {user.isDemo ? (
                        <span className="text-xs text-muted-foreground">демо-аккаунт</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AccountStatusBadge status={user.accountStatus} />
                      {/* The list row exposes only the masked phone; maskPhone() returns "—" when there is none. */}
                      <MissingPhoneBadge
                        role={user.role}
                        phone={user.maskedPhone === "—" ? null : user.maskedPhone}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.guide ? (
                      <GuideStatusBadge
                        status={user.guide.verificationStatus}
                        guideType={user.guide.guideType}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {formatRussianDateTime(user.createdAt)}
                    </span>
                  </TableCell>
                  {/* Icon-only so the actions column survives narrow viewports instead of being hidden. */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="icon-sm" variant="outline">
                        <Link
                          href={`/admin/users/${user.id}`}
                          aria-label={`Открыть карточку: ${user.fullName ?? user.maskedEmail}`}
                        >
                          <SquareArrowOutUpRight />
                        </Link>
                      </Button>
                      {user.guide && user.guide.verificationStatus === "submitted" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Быстрые действия"
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={rowPending}
                              aria-busy={rowPending || undefined}
                              onSelect={() =>
                                startRow(async () => {
                                  await approveGuideAction(user.id, null);
                                  router.refresh();
                                })
                              }
                            >
                              {rowPending ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              ) : null}
                              Одобрить гида
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Всего: {total} · страница {page} из {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= pageCount}
            onClick={() => goToPage(page + 1)}
            aria-label="Следующая страница"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Bulk confirmation modal */}
      <Dialog open={pendingBulk !== null} onOpenChange={(open) => !open && setPendingBulk(null)}>
        <DialogContent>
          <form action={runBulk}>
            <input type="hidden" name="action" value={pendingBulk ?? ""} />
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="userIds" value={id} />
            ))}
            <DialogHeader>
              <DialogTitle>
                {pendingBulk ? BULK_LABELS[pendingBulk] : ""} · {selected.size}
              </DialogTitle>
              <DialogDescription>
                Действие применится к выбранным аккаунтам. Неподходящие будут пропущены
                автоматически (например, администраторы или уже обработанные).
              </DialogDescription>
            </DialogHeader>
            {pendingBulk && BULK_NEEDS_REASON[pendingBulk] ? (
              <div className="flex flex-col gap-2 py-2">
                <Label htmlFor="bulk-reason">Причина (обязательно)</Label>
                <Textarea
                  id="bulk-reason"
                  name="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Кратко опишите причину для журнала аудита"
                  required
                />
              </div>
            ) : (
              <input type="hidden" name="reason" value="" />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPendingBulk(null)}>
                Отмена
              </Button>
              <Button
                type="submit"
                variant={
                  pendingBulk === "suspend" || pendingBulk === "archive"
                    ? "destructive"
                    : "default"
                }
                disabled={bulkPending}
                loading={bulkPending}
              >
                Подтвердить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const triggerId = useId();
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={triggerId} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={triggerId} className="w-full">
          <SelectValue placeholder="Все" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
