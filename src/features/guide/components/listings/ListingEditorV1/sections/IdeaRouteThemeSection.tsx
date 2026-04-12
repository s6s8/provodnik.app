"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { SectionProps } from "./BasicsSection";

function merged(
  listing: SectionProps["listing"],
  draft: SectionProps["draft"],
  key: "idea" | "route" | "theme",
) {
  return (key in draft ? draft[key] : listing[key]) as string | null;
}

export function IdeaRouteThemeSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const ideaM = merged(listing, draft, "idea");
  const routeM = merged(listing, draft, "route");
  const themeM = merged(listing, draft, "theme");

  const [idea, setIdea] = useState(ideaM ?? "");
  const [route, setRoute] = useState(routeM ?? "");
  const [theme, setTheme] = useState(themeM ?? "");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="idea">Идея</Label>
        <p className="text-xs text-muted-foreground">
          Чем особенна эта экскурсия?
        </p>
        <Textarea
          id="idea"
          rows={5}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onBlur={() => onChange({ idea: idea || null })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="route">Маршрут</Label>
        <p className="text-xs text-muted-foreground">
          Опишите маршрут шаг за шагом
        </p>
        <Textarea
          id="route"
          rows={5}
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          onBlur={() => onChange({ route: route || null })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="theme">Тема</Label>
        <p className="text-xs text-muted-foreground">
          Главная тема или концепция
        </p>
        <Textarea
          id="theme"
          rows={5}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onBlur={() => onChange({ theme: theme || null })}
        />
      </div>
    </div>
  );
}
