"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import { todayMoscowISODate } from "@/lib/dates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { HomepageAuthGate } from "@/features/homepage/components/homepage-auth-gate";

import {
  EMPTY_FIELDS,
  INITIAL_MESSAGE,
  isComplete,
  type ExtractedFields,
} from "../lib/extraction";
import { parseRequestText } from "../lib/parse-client";
import { SlotChips } from "./slot-chips";

const CHROME_TEXT =
  "linear-gradient(135deg,#5b6b86 0%,#9aa8be 30%,#41506b 55%,#8593ab 78%,#56657f 100%)";
const CHROME_SOLID = "linear-gradient(135deg,#3b475e 0%,#5d6d8a 100%)";

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
      className="relative flex min-h-[calc(100svh-var(--nav-h))] flex-col items-center justify-center overflow-hidden px-6 py-12"
      aria-label="Создать запрос гида"
      style={{ background: "linear-gradient(180deg,#f4f6fa 0%,#e6eaf1 100%)" }}
    >
      {/* Liquid-chrome atmosphere (Mercury) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -z-10"
        style={{
          inset: "-20%",
          filter: "blur(70px)",
          background:
            "radial-gradient(40% 40% at 30% 22%,#c3ccdb 0%,transparent 60%),radial-gradient(45% 45% at 76% 34%,#aeb9cd 0%,transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 opacity-70"
        style={{
          inset: "-20%",
          filter: "blur(70px)",
          background:
            "radial-gradient(35% 35% at 62% 82%,#9fb0cb 0%,transparent 55%),radial-gradient(40% 40% at 18% 76%,#cdd5e2 0%,transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(115deg,transparent 38%,rgba(255,255,255,0.45) 48%,transparent 60%)",
        }}
      />

      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <p className="animate-in fade-in-50 mb-4 text-[11px] font-medium uppercase tracking-[0.32em] text-slate-400 duration-500">
          проводник
        </p>
        <h1
          className="animate-in fade-in-50 slide-in-from-bottom-2 mb-4 text-center font-display text-[clamp(2.4rem,11vw,3.4rem)] font-semibold leading-[1.02] duration-700"
          style={{
            backgroundImage: CHROME_TEXT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Расскажите
          <br />о поездке
        </h1>

        <p
          className="animate-in fade-in-50 mb-8 flex min-h-[2.75rem] max-w-xs items-center justify-center gap-2 text-center text-[15px] leading-snug text-slate-500 duration-700"
          aria-live="polite"
        >
          <span aria-hidden="true" className="text-slate-400">
            ✦
          </span>
          {assistantMessage}
        </p>

        {/* The one glass bar */}
        <form
          onSubmit={handleSend}
          className="animate-in fade-in-50 slide-in-from-bottom-3 w-full duration-700"
        >
          <div className="flex items-center gap-2.5 rounded-[22px] border border-white/80 bg-white/60 py-2 pl-5 pr-2 shadow-[0_20px_50px_-16px_rgba(40,60,90,0.3)] backdrop-blur-2xl backdrop-saturate-150 transition-shadow focus-within:border-white focus-within:shadow-[0_24px_60px_-14px_rgba(40,60,90,0.4)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isParsing}
              autoFocus
              placeholder="Москва на завтра, нас двое, 5000…"
              aria-label="Опишите вашу поездку"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isParsing || !input.trim()}
              aria-label="Отправить"
              style={{ backgroundImage: CHROME_SOLID }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_8px_18px_-6px_rgba(50,70,110,0.55)] transition-opacity disabled:opacity-40"
            >
              {isParsing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span aria-hidden="true" className="text-lg leading-none">
                  ↑
                </span>
              )}
            </button>
          </div>
        </form>

        {parseError && (
          <p role="alert" className="mt-3 text-center text-sm text-red-600">
            {parseError}
          </p>
        )}

        <SlotChips fields={fields} className="mt-7 w-full" />

        {/* Confirm — mounts only when every required chip is captured */}
        {complete && (
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 mt-8 w-full duration-500">
            {serverError && (
              <p role="alert" className="mb-3 text-center text-sm text-red-600">
                {serverError}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              style={{ backgroundImage: CHROME_SOLID }}
              className="h-14 w-full rounded-[20px] text-base font-medium text-white shadow-[0_16px_40px_-12px_rgba(50,70,110,0.55)] transition-opacity disabled:opacity-50"
            >
              {isCreating ? "Отправляем…" : "Создать запрос"}
            </button>
          </div>
        )}

        <p className="mt-7 text-center text-xs text-slate-400">
          Предпочитаете заполнить вручную?{" "}
          <Link href="/" className="font-medium text-slate-600 underline-offset-2 hover:underline">
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
