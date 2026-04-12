"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { SectionProps } from "./BasicsSection";

function merged(
  listing: SectionProps["listing"],
  draft: SectionProps["draft"],
  key: "audience" | "facts",
) {
  return (key in draft ? draft[key] : listing[key]) as string | null;
}

export function AudienceFactsSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const audienceM = merged(listing, draft, "audience");
  const factsM = merged(listing, draft, "facts");

  const [audience, setAudience] = useState(audienceM ?? "");
  const [facts, setFacts] = useState(factsM ?? "");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="audience">Аудитория</Label>
        <p className="text-xs text-muted-foreground">Кому подходит?</p>
        <Textarea
          id="audience"
          rows={4}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          onBlur={() => onChange({ audience: audience || null })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="facts">Интересные факты</Label>
        <Textarea
          id="facts"
          rows={4}
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          onBlur={() => onChange({ facts: facts || null })}
        />
      </div>
    </div>
  );
}
