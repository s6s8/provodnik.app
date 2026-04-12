"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  regions: string[];
}

export function HeroSearch({ regions }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");

  return (
    <form
      className="mx-auto w-full max-w-2xl space-y-4 text-center"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(
          `/search?q=${encodeURIComponent(q)}&region=${encodeURIComponent(region)}`,
        );
      }}
    >
      <Input
        className="h-14 text-lg md:h-16 md:text-xl"
        onChange={(e) => {
          setQuery(e.target.value);
          setRegion("");
        }}
        placeholder="Куда хотите поехать?"
        value={query}
      />
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {regions.map((r) => (
          <Badge
            key={r}
            className="shrink-0 cursor-pointer px-3 py-1.5 text-xs font-medium normal-case tracking-normal md:text-sm"
            onClick={() => {
              setQuery(r);
              setRegion(r);
            }}
            variant="outline"
          >
            {r}
          </Badge>
        ))}
      </div>
      <Button className="min-w-[8rem]" size="lg" type="submit">
        Найти
      </Button>
    </form>
  );
}
