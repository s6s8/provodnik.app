"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const OPTIONS = [
  { v: "7d" as const, label: "7 дней" },
  { v: "30d" as const, label: "30 дней" },
  { v: "90d" as const, label: "90 дней" },
];

export type DateRangePreset = (typeof OPTIONS)[number]["v"];

type Props = {
  value: DateRangePreset;
  onChange?: (v: DateRangePreset) => void;
};

export function DateRangePicker({ value, onChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushRange(v: DateRangePreset) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("range", v);
    router.push(`${pathname}?${next.toString()}`);
    onChange?.(v);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Период">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.v}
          type="button"
          size="sm"
          variant={value === opt.v ? "default" : "outline"}
          onClick={() => pushRange(opt.v)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
