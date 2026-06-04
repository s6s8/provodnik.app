"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import { Button } from "@/components/ui/button";
import { todayMoscowISODate } from "@/lib/dates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { HomepageAuthGate } from "@/features/homepage/components/homepage-auth-gate";

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
      className="relative flex min-h-[calc(100svh-var(--nav-h))] flex-col items-center justify-center overflow-hidden px-[clamp(20px,4vw,48px)] py-12"
      aria-label="Создать запрос гида"
    >
      {/* Atmosphere: soft brand wash + grain-free radial depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, var(--brand-light) 0%, transparent 55%), radial-gradient(80% 60% at 85% 110%, rgba(33,112,228,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <p className="animate-in fade-in-50 mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary/80 duration-500">
          Проводник
        </p>
        <h1 className="animate-in fade-in-50 slide-in-from-bottom-2 mb-3 text-center font-display text-[clamp(2rem,6vw,3.25rem)] leading-[1.08] text-foreground duration-700">
          Расскажите о поездке
        </h1>

        <p
          className="animate-in fade-in-50 mb-7 flex min-h-[2.5rem] items-center justify-center gap-2 text-center text-[15px] leading-snug text-muted-foreground duration-700"
          aria-live="polite"
        >
          <span aria-hidden="true" className="text-base">
            ✨
          </span>
          {assistantMessage}
        </p>

        {/* The one bar */}
        <form
          onSubmit={handleSend}
          className="animate-in fade-in-50 slide-in-from-bottom-3 w-full duration-700"
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-input bg-card p-2 pl-4 shadow-soft transition-shadow",
              "focus-within:border-primary/50 focus-within:shadow-panel",
            )}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isParsing}
              autoFocus
              placeholder="Москва на завтра, нас двое, 5000, история и еда…"
              aria-label="Опишите вашу поездку"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isParsing || !input.trim()}
              aria-label="Отправить"
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              {isParsing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              ) : (
                <span aria-hidden="true" className="text-lg leading-none">
                  ↑
                </span>
              )}
            </Button>
          </div>
        </form>

        {parseError && (
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {parseError}
          </p>
        )}

        <SlotChips fields={fields} className="mt-8 w-full" />

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
              className="h-14 w-full rounded-2xl text-base"
            >
              {isCreating ? "Отправляем…" : "Создать запрос"}
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Предпочитаете заполнить вручную?{" "}
          <Link href="/form" className="font-medium text-primary underline-offset-2 hover:underline">
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
