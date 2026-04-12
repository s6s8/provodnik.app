"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { SectionProps } from "./BasicsSection";

const INCLUDED_SUGGESTIONS = [
  "Экипировка",
  "Гид",
  "Страховка",
  "Транспорт",
  "Питание",
] as const;

const NOT_INCLUDED_SUGGESTIONS = [
  "Авиабилеты",
  "Визы",
  "Личные расходы",
  "Чаевые",
] as const;

function TagListBlock({
  label,
  items,
  suggestions,
  onItemsChange,
}: {
  label: string;
  items: string[];
  suggestions: readonly string[];
  onItemsChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addRaw = (raw: string) => {
    const t = raw.trim();
    if (!t || items.includes(t)) return;
    onItemsChange([...items, t]);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1 pr-1">
            <span>{item}</span>
            <button
              type="button"
              className="rounded-sm px-1 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label={`Удалить ${item}`}
              onClick={() => onItemsChange(items.filter((x) => x !== item))}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRaw(input);
            }
          }}
          placeholder="Добавить пункт"
          className="max-w-md flex-1 min-w-[200px]"
        />
        <Button type="button" variant="outline" onClick={() => addRaw(input)}>
          Добавить
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Button
            key={s}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full border border-border px-3 text-xs"
            onClick={() => addRaw(s)}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function IncludedExcludedSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const merged = useMemo(
    () => ({ ...listing, ...draft }),
    [listing, draft],
  );

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <TagListBlock
        label="Включено в стоимость"
        items={merged.included}
        suggestions={INCLUDED_SUGGESTIONS}
        onItemsChange={(included) => onChange({ included })}
      />
      <TagListBlock
        label="Не включено в стоимость"
        items={merged.not_included}
        suggestions={NOT_INCLUDED_SUGGESTIONS}
        onItemsChange={(not_included) => onChange({ not_included })}
      />
    </div>
  );
}
