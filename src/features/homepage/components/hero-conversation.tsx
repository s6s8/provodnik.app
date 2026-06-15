"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createRequestAction } from "@/features/requests/create-request-actions";
import { Button } from "@/components/ui/button";
import { todayMoscowISODate } from "@/lib/dates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { HomepageAuthGate } from "@/features/homepage-classic/components/homepage-auth-gate";

import {
  EMPTY_FIELDS,
  INITIAL_MESSAGE,
  isComplete,
  type ExtractedFields,
} from "../lib/extraction";
import { parseRequestText } from "../lib/parse-client";
import { SlotChips } from "./slot-chips";

function buildFormData(fields: ExtractedFields): FormData {
  const fd = new FormData();
  fd.set("mode", "private");
  for (const interest of fields.interests) fd.append("interests[]", interest);
  const languages = fields.requestedLanguages.length ? fields.requestedLanguages : ["Русский"];
  for (const language of languages) fd.append("requested_languages[]", language);
  fd.set("destination", fields.destination ?? "");
  fd.set("startDate", fields.startDate ?? "");
  fd.set("startTime", fields.startTime ?? "");
  fd.set("endTime", fields.endTime ?? "");
  fd.set("groupSize", String(fields.groupSize ?? 1));
  fd.set("budgetPerPersonRub", String(fields.budgetPerPersonRub ?? 0));
  // v3 default: let guides propose nearby dates/times for more matches.
  fd.set("allowGuideSuggestions", "true");
  fd.set("notes", fields.notes ?? "");
  return fd;
}

export function HeroConversation() {
  const router = useRouter();
  const [fields, setFields] = React.useState<ExtractedFields>(EMPTY_FIELDS);
  const [assistantMessage, setAssistantMessage] = React.useState<string>(INITIAL_MESSAGE);
  const [input, setInput] = React.useState("");
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [authGateOpen, setAuthGateOpen] = React.useState(false);
  const pendingFormData = React.useRef<FormData | null>(null);

  const complete = isComplete(fields);

  const handleSend = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const userText = input.trim();
      if (!userText || isParsing) return;

      setIsParsing(true);
      setParseError(null);
      try {
        const result = await parseRequestText({
          userText,
          accumulatedFields: fields,
          todayMoscow: todayMoscowISODate(),
        });
        setFields(result.fields);
        if (result.assistantMessage) setAssistantMessage(result.assistantMessage);
        setInput("");
      } catch (error) {
        setParseError(error instanceof Error ? error.message : "Что-то пошло не так.");
      } finally {
        setIsParsing(false);
      }
    },
    [input, isParsing, fields],
  );

  const submitWithFormData = React.useCallback(async (fd: FormData) => {
    setIsCreating(true);
    setServerError(null);
    try {
      // On success the server action redirects; only the error branch returns.
      const result = await createRequestAction({ error: null }, fd);
      if (result?.error) setServerError(result.error);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleCreate = React.useCallback(async () => {
    const fd = buildFormData(fields);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await submitWithFormData(fd);
      } else {
        pendingFormData.current = fd;
        setAuthGateOpen(true);
      }
    } catch {
      pendingFormData.current = fd;
      setAuthGateOpen(true);
    }
  }, [fields, submitWithFormData]);

  const handleAuthSuccess = React.useCallback(async () => {
    setAuthGateOpen(false);
    router.refresh();
    const fd = pendingFormData.current;
    if (fd) {
      pendingFormData.current = null;
      await submitWithFormData(fd);
    }
  }, [router, submitWithFormData]);

  return (
    <section
      className="relative flex min-h-[calc(100svh-var(--nav-h))] flex-col items-center justify-center overflow-hidden bg-[var(--surface)] px-[clamp(20px,4vw,48px)] py-[clamp(72px,10vw,128px)] font-display"
      aria-label="Создать запрос гида"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[min(760px,90vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(31,122,92,0.16),rgba(238,247,242,0.42)_38%,transparent_72%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <h1
          className="animate-in fade-in-50 slide-in-from-bottom-2 mb-4 text-center text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--on-surface)] duration-700"
        >
          Расскажите <span className="text-[var(--primary)]">о поездке</span>
        </h1>

        <p
          className="animate-in fade-in-50 mb-8 flex min-h-[2.5rem] max-w-2xl items-center justify-center text-center text-[clamp(1rem,2vw,1.125rem)] leading-relaxed text-[var(--on-surface-muted)] duration-700"
          aria-live="polite"
        >
          {assistantMessage}
        </p>

        <form
          onSubmit={handleSend}
          className="animate-in fade-in-50 slide-in-from-bottom-3 w-full duration-700"
        >
          <div
            className={cn(
              "flex items-center gap-3 rounded-[20px] border border-[var(--outline)] bg-white p-3 pl-5 shadow-[0_18px_48px_-28px_rgba(10,40,28,0.38),0_4px_24px_rgba(10,40,28,0.08)] transition-shadow",
              "focus-within:border-[var(--primary)] focus-within:shadow-[0_20px_54px_-28px_rgba(10,40,28,0.45),0_0_0_4px_rgba(31,122,92,0.10)]",
            )}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isParsing}
              autoFocus
              placeholder="Москва, завтра, вдвоём, 5000 ₽, история и еда"
              aria-label="Опишите вашу поездку"
              className="min-w-0 flex-1 bg-transparent py-2 text-[16px] font-normal leading-6 text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)] focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isParsing || !input.trim()}
              aria-label="Отправить"
              className="h-12 w-12 shrink-0 rounded-[14px] bg-[var(--primary)] text-white shadow-[0_12px_24px_-16px_rgba(10,39,30,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:text-white focus-visible:ring-[rgba(31,122,92,0.30)]"
            >
              {isParsing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span aria-hidden="true" className="text-xl leading-none">
                  ↑
                </span>
              )}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs font-medium text-[var(--on-surface-muted)]">
          Бесплатно · без регистрации · местный гид, а не турбюро
        </p>

        {parseError && (
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {parseError}
          </p>
        )}

        <SlotChips
          fields={fields}
          className="mt-8 w-full [&_[data-filled]]:border-[var(--outline)] [&_[data-filled]]:px-4 [&_[data-filled]]:py-2 [&_[data-filled]]:font-semibold [&_[data-filled]]:text-[var(--primary)] [&_[data-filled=false]]:border-solid [&_[data-filled=false]]:bg-white [&_[data-filled=true]]:bg-[var(--brand-50)] [&_p]:font-medium [&_p]:text-[var(--on-surface-muted)]"
        />

        {/* Honest, deferred urgency — appears only once a date is set; the deadline is the traveler's own */}
        {fields.startDate && !complete && (
          <p
            className="animate-in fade-in-50 mt-6 flex items-center justify-center gap-2 rounded-[14px] border border-[rgba(224,161,38,0.30)] bg-[rgba(224,161,38,0.12)] px-3 py-2 text-center text-[13px] leading-snug text-[#8A6A12] duration-500"
          >
            <span aria-hidden="true">⏳</span>
            На популярные даты гидов разбирают быстро — отправьте запрос, пока выбор большой.
          </p>
        )}

        {/* Confirm — mounts only when every required chip is green */}
        {complete && (
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 mt-8 w-full duration-500">
            {serverError && (
              <p role="alert" className="mb-3 text-center text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="h-14 w-full rounded-[14px] bg-[var(--primary)] text-base font-semibold text-white shadow-[0_16px_34px_-22px_rgba(10,39,30,0.75)] transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:text-white"
            >
              {isCreating ? "Отправляем…" : "Подобрать гида"}
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[var(--on-surface-muted)]">
          Предпочитаете заполнить вручную?{" "}
          <Link href="/" className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline">
            Обычная форма
          </Link>
        </p>
      </div>

      <HomepageAuthGate
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </section>
  );
}
