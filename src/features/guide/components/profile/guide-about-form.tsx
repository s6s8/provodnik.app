"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES } from "@/data/languages";
import { InterestChipGroup } from "@/features/shared/components/interest-chip-group";
import {
  formatGuideRegionsInput,
  parseGuideRegionsInput,
} from "@/lib/profile/guide-regions";
import { saveGuideAboutAction } from "@/features/guide/profile-actions";

interface GuideAboutFormProps {
  initialBio: string;
  initialBaseCity: string;
  initialLanguages: string[];
  initialSpecializations: string[];
  initialYearsExperience: number | null;
  initialRegions: string[];
  isLocked?: boolean;
}

export function GuideAboutForm({
  initialBio,
  initialBaseCity,
  initialLanguages,
  initialSpecializations,
  initialYearsExperience,
  initialRegions,
  isLocked = false,
}: GuideAboutFormProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [baseCity, setBaseCity] = React.useState(initialBaseCity);
  const [regionsRaw, setRegionsRaw] = React.useState(formatGuideRegionsInput(initialRegions));
  const [specializations, setSpecializations] = React.useState<string[]>(initialSpecializations);
  const parsedRegions = parseGuideRegionsInput(regionsRaw);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!isLocked) {
      formData.set("base_city", baseCity.trim());
    }
    setStatus("saving");
    const result = await saveGuideAboutAction(formData);
    if (result.ok) {
      setRegionsRaw(formatGuideRegionsInput(result.regions));
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-xl">
      {isLocked && (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>
            Профиль одобрен. Проверенные данные недоступны для редактирования — для изменений напишите администраторам. Текст «О себе» можно обновлять.
          </AlertDescription>
        </Alert>
      )}
      {/* Bio */}
      <div className="space-y-2">
        <Textarea
          id="bio"
          name="bio"
          aria-label="О себе"
          defaultValue={initialBio}
          rows={6}
          placeholder="Расскажите о себе: опыт, специализация, что вас вдохновляет..."
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Пишите честно и тепло — путешественники выбирают гида, а не резюме. Текст увидят все посетители вашей публичной страницы.
        </p>
      </div>

      <fieldset disabled={isLocked} className="space-y-6 border-0 p-0 m-0">
      {/* Base city */}
      <div className="space-y-2">
        <Label htmlFor="base_city">Базовый город</Label>
        <Input
          id="base_city"
          name="base_city"
          type="text"
          value={baseCity}
          onChange={(e) => setBaseCity(e.target.value)}
          placeholder="Санкт-Петербург"
        />
      </div>

      {/* Regions */}
      <div className="space-y-2">
        <Label htmlFor="regions">Регионы</Label>
        <Input
          id="regions"
          type="text"
          value={regionsRaw}
          onChange={(e) => setRegionsRaw(e.target.value)}
          placeholder="Санкт-Петербург, Карелия"
        />
        <p className="text-xs text-muted-foreground">Через запятую — регионы, где вы проводите экскурсии.</p>
        {parsedRegions.map((region, index) => (
          <input key={`${index}-${region}`} type="hidden" name="regions" value={region} />
        ))}
      </div>

      {/* Years of experience */}
      <div className="space-y-2">
        <Label htmlFor="years_experience">Лет опыта в роли гида</Label>
        <Input
          id="years_experience"
          name="years_experience"
          type="number"
          min={0}
          max={60}
          defaultValue={initialYearsExperience ?? ""}
          placeholder="Например: 5"
          className="w-32"
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

      </fieldset>
      <div className="mt-6 space-y-3">
        {status === "error" ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={status === "saving"}>
            Сохранить
          </Button>
          {status === "saved" ? (
            <p className="text-sm text-success">Сохранено</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
