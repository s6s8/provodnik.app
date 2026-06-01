"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/data/languages";
import { InterestChipGroup } from "@/features/shared/components/interest-chip-group";
import { saveGuideAboutAction } from "./actions";

interface GuideAboutFormProps {
  initialBio: string;
  initialBaseCity: string;
  initialLanguages: string[];
  initialSpecializations: string[];
  initialYearsExperience: number | null;
  initialRegions: string[];
}

export function GuideAboutForm({
  initialBio,
  initialBaseCity,
  initialLanguages,
  initialSpecializations,
  initialYearsExperience,
  initialRegions,
}: GuideAboutFormProps) {
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [baseCity, setBaseCity] = React.useState(initialBaseCity);
  const [regions, setRegions] = React.useState<string[]>(initialRegions);
  const [specializations, setSpecializations] = React.useState<string[]>(initialSpecializations);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const trimmedBaseCity = baseCity.trim();
    if (trimmedBaseCity === "") {
      setErrorMsg("Укажите базовый город");
      setStatus("error");
      return;
    }

    formData.set("base_city", trimmedBaseCity);
    setStatus("saving");
    const result = await saveGuideAboutAction(formData);
    if (result.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-xl">
      {/* Bio */}
      <div className="space-y-2">
        <textarea
          id="bio"
          name="bio"
          aria-label="О себе"
          defaultValue={initialBio}
          rows={6}
          placeholder="Расскажите о себе: опыт, специализация, что вас вдохновляет..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Пишите честно и тепло — путешественники выбирают гида, а не резюме. Текст увидят все посетители вашей публичной страницы.
        </p>
      </div>

      {/* Base city */}
      <div className="space-y-2">
        <label htmlFor="base_city" className="text-sm font-medium text-foreground">
          Базовый город
        </label>
        <input
          id="base_city"
          name="base_city"
          type="text"
          value={baseCity}
          onChange={(e) => setBaseCity(e.target.value)}
          placeholder="Санкт-Петербург"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Regions */}
      <div className="space-y-2">
        <label htmlFor="regions" className="text-sm font-medium text-foreground">
          Регионы
        </label>
        <input
          id="regions"
          type="text"
          value={regions.join(", ")}
          onChange={(e) =>
            setRegions(e.target.value.split(",").map((r) => r.trim()).filter(Boolean))
          }
          placeholder="Санкт-Петербург, Карелия"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-muted-foreground">Через запятую — регионы, где вы проводите экскурсии.</p>
        {regions.map((r, i) => (
          <input key={i} type="hidden" name="regions" value={r} />
        ))}
      </div>

      {/* Years of experience */}
      <div className="space-y-2">
        <label htmlFor="years_experience" className="text-sm font-medium text-foreground">
          Лет опыта в роли гида
        </label>
        <input
          id="years_experience"
          name="years_experience"
          type="number"
          min={0}
          max={60}
          defaultValue={initialYearsExperience ?? ""}
          placeholder="Например: 5"
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Languages */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Языки проведения экскурсий</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((lang) => (
            <label
              key={lang}
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                name="languages"
                value={lang}
                defaultChecked={initialLanguages.includes(lang)}
                className="size-5 rounded border-border accent-primary"
              />
              {lang}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Темы экскурсий</legend>
        <p className="text-xs text-muted-foreground">
          Отметьте темы, по которым вы готовы вести экскурсии. Запросы по этим темам будут показаны в верху вашей ленты. Остальные запросы по-прежнему видны.
        </p>
        <InterestChipGroup
          name="specializations"
          selected={specializations}
          onChange={setSpecializations}
          ariaLabel="Темы экскурсий"
        />
      </fieldset>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Сохраняем…" : "Сохранить"}
        </Button>
        {status === "saved" ? (
          <p className="text-sm text-green-600">Сохранено</p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-destructive">{errorMsg}</p>
        ) : null}
      </div>
    </form>
  );
}
