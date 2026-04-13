"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { saveGuideAboutAction } from "./actions";

const LANGUAGES = [
  "Русский",
  "Английский",
  "Немецкий",
  "Французский",
  "Испанский",
  "Итальянский",
  "Китайский",
  "Японский",
  "Арабский",
  "Португальский",
  "Польский",
  "Чешский",
  "Финский",
  "Шведский",
  "Норвежский",
  "Датский",
  "Нидерландский",
  "Турецкий",
  "Корейский",
] as const;

interface GuideAboutFormProps {
  initialBio: string;
  initialLanguages: string[];
  initialYearsExperience: number | null;
}

export function GuideAboutForm({
  initialBio,
  initialLanguages,
  initialYearsExperience,
}: GuideAboutFormProps) {
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("saving");
    const formData = new FormData(e.currentTarget);
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
        <label htmlFor="bio" className="text-sm font-medium text-foreground">
          Биография
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initialBio}
          rows={6}
          placeholder="Расскажите о себе: опыт, специализация, что вас вдохновляет..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Отображается на вашей публичной странице. Пишите честно и тепло — путешественники выбирают гида, а не резюме.
        </p>
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
            <label key={lang} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                name="languages"
                value={lang}
                defaultChecked={initialLanguages.includes(lang)}
                className="size-4 rounded border-border accent-primary"
              />
              {lang}
            </label>
          ))}
        </div>
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
