"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { SectionProps } from "./BasicsSection";

type Row = { id: string; key: string; value: string };

function toRows(details: Record<string, unknown> | null): Row[] {
  if (!details || typeof details !== "object") return [];
  return Object.entries(details).map(([key, value], i) => ({
    id: `row-${key}-${i}`,
    key,
    value: value === null || value === undefined ? "" : String(value),
  }));
}

function rowsToObject(rows: Row[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    const k = r.key.trim();
    if (!k) continue;
    out[k] = r.value;
  }
  return out;
}

let rowNonce = 0;
function newRow(): Row {
  rowNonce += 1;
  return { id: `new-${rowNonce}`, key: "", value: "" };
}

export function OrgDetailsSection({
  listing,
  onChange,
  draft: _draft,
  userId: _userId,
}: SectionProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    toRows(listing.org_details),
  );

  const pushObject = useCallback(
    (next: Row[]) => {
      setRows(next);
      onChange({ org_details: rowsToObject(next) });
    },
    [onChange],
  );

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="flex flex-col gap-2">
            <Input
              aria-label="Ключ поля"
              placeholder="Место проведения, Адрес, Телефон зала…"
              value={row.key}
              onChange={(e) => {
                const next = rows.slice();
                next[i] = { ...row, key: e.target.value };
                pushObject(next);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Input
              aria-label="Значение поля"
              placeholder="Значение"
              value={row.value}
              onChange={(e) => {
                const next = rows.slice();
                next[i] = { ...row, value: e.target.value };
                pushObject(next);
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            className="sm:mb-0.5"
            onClick={() => {
              const next = rows.filter((_, j) => j !== i);
              pushObject(next);
            }}
          >
            Удалить
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => pushObject([...rows, newRow()])}
      >
        Добавить поле
      </Button>
    </div>
  );
}
