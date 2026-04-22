"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { createQuickRequestAction, type QuickRequestState } from "@/app/(protected)/traveler/requests/quick/actions";
import { Button } from "@/components/ui/button";
import type { DestinationOption } from "@/data/supabase/queries";
import { cn } from "@/lib/utils";

type DurationKey = "1-2d" | "3-5d" | "7d" | "14d" | "custom";
type CompanionKey = "solo" | "pair" | "friends" | "kids" | "group";
type ActiveSlot = "destination" | "duration" | "companion" | null;

const DURATION_LABELS: Record<DurationKey, string> = {
  "1-2d": "1–2 дня",
  "3-5d": "3–5 дней",
  "7d": "неделю",
  "14d": "2 недели",
  "custom": "свой вариант",
};

const COMPANION_LABELS: Record<CompanionKey, string> = {
  solo: "один",
  pair: "с парой",
  friends: "с друзьями",
  kids: "с детьми",
  group: "группой",
};

const initialState: QuickRequestState = { error: null };

interface Props {
  destinations: DestinationOption[];
}

export function HomePageHero2({ destinations }: Props) {
  const [destination, setDestination] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<DurationKey | null>(null);
  const [companion, setCompanion] = React.useState<CompanionKey | null>(null);
  const [activeSlot, setActiveSlot] = React.useState<ActiveSlot>(null);
  const [destSearch, setDestSearch] = React.useState("");
  const [customStart, setCustomStart] = React.useState("");
  const [customEnd, setCustomEnd] = React.useState("");
  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);

  const [state, dispatch, isPending] = React.useActionState(
    createQuickRequestAction,
    initialState,
  );

  React.useEffect(() => {
    import("@/lib/supabase/client").then(({ createSupabaseBrowserClient }) => {
      try {
        createSupabaseBrowserClient()
          .auth.getUser()
          .then(({ data }) => setIsAuthed(!!data.user))
          .catch(() => setIsAuthed(false));
      } catch {
        setIsAuthed(false);
      }
    });
  }, []);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveSlot(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredDestinations = React.useMemo(() => {
    if (!destSearch) return destinations;
    const q = destSearch.toLowerCase();
    return destinations.filter((d) => d.name.toLowerCase().includes(q));
  }, [destinations, destSearch]);

  function toggleSlot(slot: ActiveSlot) {
    setActiveSlot((prev) => (prev === slot ? null : slot));
  }

  function handleSubmit() {
    if (!destination) return;

    if (!isAuthed) {
      const params = new URLSearchParams({ destination });
      if (duration) params.set("duration", duration);
      if (companion) params.set("companion", companion);
      if (customStart) params.set("customStart", customStart);
      if (customEnd) params.set("customEnd", customEnd);
      window.location.href = `/auth?redirect=/traveler/requests/quick?${params.toString()}`;
      return;
    }

    const fd = new FormData();
    fd.set("destination", destination);
    if (duration) fd.set("duration", duration);
    if (companion) fd.set("companion", companion);
    if (customStart) fd.set("customStart", customStart);
    if (customEnd) fd.set("customEnd", customEnd);
    dispatch(fd);
  }

  return (
    <section
      aria-label="Создать запрос"
      className="-mt-nav-h relative flex min-h-screen items-center justify-center overflow-hidden"
      onClick={() => setActiveSlot(null)}
    >
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=85"
        alt="Горный пейзаж России — путешествуйте с локальными проводниками"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(25,28,32,0.35)_0%,rgba(25,28,32,0.68)_100%)]"
      />

      <div
        className="relative z-10 mx-auto w-full max-w-3xl px-[clamp(20px,4vw,48px)] pt-[calc(var(--nav-h,72px)+64px)] pb-20 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          СКАЖИТЕ ОДНОЙ ФРАЗОЙ — ГИДЫ ОТВЕТЯТ
        </p>

        <p className="mb-6 font-display text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.2] text-white">
          {"Хочу в "}
          <SlotButton
            label={destination ?? "___"}
            filled={!!destination}
            active={activeSlot === "destination"}
            onClick={() => toggleSlot("destination")}
            aria-label="Выбрать направление"
          />
          {" на "}
          <SlotButton
            label={duration ? DURATION_LABELS[duration] : "___"}
            filled={!!duration}
            active={activeSlot === "duration"}
            onClick={() => toggleSlot("duration")}
            aria-label="Выбрать длительность"
          />
          {" "}
          <SlotButton
            label={companion ? COMPANION_LABELS[companion] : "с кем?"}
            filled={!!companion}
            active={activeSlot === "companion"}
            onClick={() => toggleSlot("companion")}
            aria-label="Выбрать компанию"
            optional
          />
        </p>

        {activeSlot === "destination" && (
          <DestinationPicker
            destinations={filteredDestinations}
            search={destSearch}
            onSearch={setDestSearch}
            onSelect={(name) => {
              setDestination(name);
              setActiveSlot(null);
              setDestSearch("");
            }}
          />
        )}

        {activeSlot === "duration" && (
          <DurationPicker
            selected={duration}
            onSelect={(d) => {
              setDuration(d);
              if (d !== "custom") setActiveSlot(null);
            }}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStart={setCustomStart}
            onCustomEnd={(v) => {
              setCustomEnd(v);
              if (customStart) setActiveSlot(null);
            }}
          />
        )}

        {activeSlot === "companion" && (
          <CompanionPicker
            selected={companion}
            onSelect={(c) => {
              setCompanion(c);
              setActiveSlot(null);
            }}
          />
        )}

        {state.error && (
          <p role="alert" className="mb-4 text-sm text-red-300">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={handleSubmit}
            disabled={!destination || isPending}
            size="lg"
            className="min-w-[200px] bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Отправляем..." : "→ Отправить гидам"}
          </Button>
          <Link
            href="/listings"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Смотреть готовые туры →
          </Link>
        </div>
        <p className="mt-3 text-xs text-white/50">обычно 4–7 предложений за 24 часа</p>
      </div>
    </section>
  );
}

function SlotButton({
  label, filled, active, onClick, optional, "aria-label": ariaLabel,
}: {
  label: string;
  filled: boolean;
  active: boolean;
  onClick: () => void;
  optional?: boolean;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={active}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "inline cursor-pointer font-display transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        filled
          ? "rounded bg-primary px-2 py-0.5 text-white"
          : optional
            ? "border-b border-white/30 px-1 italic text-white/40"
            : "border-b-2 border-white/70 px-1 italic text-white/60",
        active && "outline outline-2 outline-white/50",
      )}
    >
      {label}
    </button>
  );
}

function DestinationPicker({
  destinations, search, onSearch, onSelect,
}: {
  destinations: DestinationOption[];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (name: string) => void;
}) {
  const listboxId = "dest-listbox";
  return (
    <div
      className="mx-auto mb-6 w-full max-w-sm rounded-xl border border-white/20 bg-black/70 p-3 backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={true}
        aria-controls={listboxId}
        aria-label="Поиск направления"
        type="text"
        placeholder="Поиск направления..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="mb-2 w-full rounded-lg border-none bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
      />
      <ul id={listboxId} role="listbox" aria-label="Направления" className="max-h-48 overflow-y-auto">
        {destinations.length === 0 && (
          <li role="option" aria-selected={false} className="py-2 text-center text-sm text-white/40">
            Ничего не найдено
          </li>
        )}
        {destinations.map((d) => (
          <li key={`${d.name}|${d.region}`} role="option" aria-selected={false}>
            <button
              type="button"
              onClick={() => onSelect(d.name)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            >
              <span>{d.name}</span>
              <span className="text-xs text-white/40">{d.guideCount} гидов</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DurationPicker({
  selected, onSelect, customStart, customEnd, onCustomStart, onCustomEnd,
}: {
  selected: DurationKey | null;
  onSelect: (d: DurationKey) => void;
  customStart: string;
  customEnd: string;
  onCustomStart: (v: string) => void;
  onCustomEnd: (v: string) => void;
}) {
  const options: DurationKey[] = ["1-2d", "3-5d", "7d", "14d", "custom"];
  return (
    <div
      role="group"
      aria-label="Длительность поездки"
      className="mx-auto mb-6 w-full max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            onClick={() => onSelect(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              selected === key
                ? "border-primary bg-primary text-white"
                : "border-white/30 text-white/80 hover:border-white hover:text-white",
            )}
          >
            {DURATION_LABELS[key]}
          </button>
        ))}
      </div>
      {selected === "custom" && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <input
            type="date"
            aria-label="Дата начала"
            value={customStart}
            onChange={(e) => onCustomStart(e.target.value)}
            className="rounded border border-white/20 bg-black/50 px-2 py-1 text-sm text-white"
          />
          <span aria-hidden="true" className="text-white/50">—</span>
          <input
            type="date"
            aria-label="Дата окончания"
            value={customEnd}
            onChange={(e) => onCustomEnd(e.target.value)}
            className="rounded border border-white/20 bg-black/50 px-2 py-1 text-sm text-white"
          />
        </div>
      )}
    </div>
  );
}

function CompanionPicker({
  selected, onSelect,
}: {
  selected: CompanionKey | null;
  onSelect: (c: CompanionKey) => void;
}) {
  const options: CompanionKey[] = ["solo", "pair", "friends", "kids", "group"];
  return (
    <div
      role="group"
      aria-label="С кем едете"
      className="mx-auto mb-6 flex flex-wrap justify-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected === key}
          onClick={() => onSelect(key)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            selected === key
              ? "border-primary bg-primary text-white"
              : "border-white/30 text-white/80 hover:border-white hover:text-white",
          )}
        >
          {COMPANION_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
