"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, Clock } from "lucide-react";

import { createRequestAction } from "@/features/requests/create-request-actions";
import { Button } from "@/components/ui/button";
import { todayMoscowISODate } from "@/lib/dates";
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
      // Gate to auth only when the server confirms the caller is signed out —
      // never on a browser getUser() pre-check that races cookie refresh (#34).
      if (result?.code === "auth_required") {
        pendingFormData.current = fd;
        setAuthGateOpen(true);
      } else if (result?.error) {
        setServerError(result.error);
      }
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleCreate = React.useCallback(async () => {
    await submitWithFormData(buildFormData(fields));
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
      {/* Calm frosted background: a crisp, optimized photo softened by a light
          frost + central wash — soft texture, not the old muddy heavy blur. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-surface-low">
        <Image
          src="/hero-valley.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover object-[center_42%] opacity-[0.42] [filter:blur(5px)_saturate(0.96)]"
        />
        {/* Light wash → frosted lens at center keeps the form crisp and legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(72% 48% at 50% 46%, rgba(248,251,247,0.92) 0%, rgba(248,251,247,0.60) 42%, rgba(248,251,247,0.18) 68%, transparent 84%), linear-gradient(180deg, rgba(243,248,244,0.42) 0%, rgba(243,248,244,0.05) 28%, transparent 58%, rgba(233,242,236,0.50) 100%)",
          }}
        />
        {/* Subtle gold glow, top-right */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(38% 26% at 84% 10%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 60%)" }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <h1
          className="animate-in fade-in-50 slide-in-from-bottom-2 mb-3 text-center font-display text-[clamp(2rem,6vw,3.25rem)] leading-[1.08] duration-700"
          style={{
            backgroundImage: "linear-gradient(135deg,var(--navy-500) 0%,var(--navy-600) 50%,var(--navy-700) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Расскажите о поездке
        </h1>

        <p
          className="animate-in fade-in-50 mb-7 flex min-h-[2.5rem] items-center justify-center text-center text-[15px] leading-snug text-muted-foreground duration-700"
          aria-live="polite"
        >
          {assistantMessage}
        </p>

        {/* The one bar — frosted glass */}
        <form
          onSubmit={handleSend}
          className="animate-in fade-in-50 slide-in-from-bottom-3 w-full duration-700"
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-white/90 bg-[rgba(255,255,255,0.82)] p-2 pl-4 shadow-panel backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,border-color]",
              "focus-within:border-primary/60 focus-within:shadow-lift",
            )}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isParsing}
              autoFocus
              placeholder="Москва, завтра, вдвоём, 5000 ₽"
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
                <ArrowUp className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </form>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Бесплатно · без регистрации · местный гид, а не турбюро
        </p>
        <p className="mt-1.5 text-center text-[13px] text-on-surface-muted">
          Гиды обычно отвечают в течение дня
        </p>

        {parseError && (
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {parseError}
          </p>
        )}

        <SlotChips fields={fields} className="mt-8 w-full" />

        {/* Honest, deferred urgency — appears only once a date is set; the deadline is the traveler's own */}
        {fields.startDate && !complete && (
          <p
            className="animate-in fade-in-50 mt-6 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-[13px] leading-snug duration-500"
            style={{
              color: "#8A6A12",
              background: "rgba(224,161,38,0.12)",
              border: "1px solid rgba(224,161,38,0.3)",
            }}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
              className="h-14 w-full rounded-2xl text-base"
            >
              {isCreating ? "Отправляем…" : "Подобрать гида"}
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Предпочитаете заполнить вручную?{" "}
          <Link href="/" className="font-medium text-primary underline-offset-2 hover:underline">
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
