"use client";

import * as React from "react";

import { updateRequestDetailsAction } from "@/app/(protected)/traveler/requests/sent-actions";
import { cn } from "@/lib/utils";

const BUDGET_OPTIONS = [
  { label: "до 10 тыс.", value: 10000 },
  { label: "10–30 тыс.", value: 30000 },
  { label: "30–60 тыс.", value: 60000 },
  { label: "от 60 тыс.", value: 60001 },
] as const;

interface Props {
  requestId: string;
}

export function SentScreenEnrich({ requestId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [committedBudget, setCommittedBudget] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle");
  const notesTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [optimisticBudget, setOptimisticBudget] = React.useOptimistic(committedBudget);

  async function handleBudgetSelect(value: number) {
    React.startTransition(() => setOptimisticBudget(value));
    setSaveState("saving");
    const result = await updateRequestDetailsAction(requestId, { budgetRub: value });
    if (result.ok) {
      setCommittedBudget(value);
      setSaveState("saved");
    } else {
      setSaveState("idle");
    }
    setTimeout(() => setSaveState("idle"), 2000);
  }

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    setSaveState("saving");
    notesTimerRef.current = setTimeout(async () => {
      await updateRequestDetailsAction(requestId, { notes: value });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    }, 800);
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
      >
        <span>Добавить детали (необязательно)</span>
        <span aria-hidden="true" className="text-muted-foreground">{open ? "↑" : "↓"}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground" id="budget-label">
              Бюджет на человека
            </p>
            <div role="group" aria-labelledby="budget-label" className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={optimisticBudget === opt.value}
                  onClick={() => handleBudgetSelect(opt.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    optimisticBudget === opt.value
                      ? "border-primary bg-primary text-white"
                      : "border-border text-foreground hover:border-primary",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Расскажите подробнее</p>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              maxLength={280}
              rows={3}
              aria-label="Дополнительная информация для гидов"
              placeholder="Особые пожелания, интересы, ограничения..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">{notes.length}/280</p>
          </div>

          <p aria-live="polite" className="text-xs text-muted-foreground">
            {saveState === "saving" ? "Сохраняем..." : saveState === "saved" ? "✓ Сохранено" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
