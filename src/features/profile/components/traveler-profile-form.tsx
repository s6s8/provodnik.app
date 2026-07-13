"use client";

import { useState, useTransition } from "react";

import { updateTravelerProfile } from "@/features/profile/account-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TravelerProfile } from "@/lib/profile/types";

import { findContactInBio } from "../validation/anti-contact";
import { useRouter } from "next/navigation";

export type { TravelerProfile };

const languageOptions = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export function TravelerProfileForm({ profile }: { profile: TravelerProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.full_name ?? "");
  const [homeCity, setHomeCity] = useState(profile.home_city ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(profile.languages ?? []);
  const [birthYear, setBirthYear] = useState(profile.birth_year?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleLanguage(value: string, checked: boolean) {
    setSelectedLanguages((prev) =>
      checked
        ? prev.includes(value)
          ? prev
          : [...prev, value]
        : prev.filter((entry) => entry !== value),
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNameError(null);
    if (!name.trim()) {
      setNameError("Укажите имя");
      return;
    }
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateTravelerProfile(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>О вас</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "name-error" : undefined}
              />
              {nameError ? (
                <p id="name-error" role="alert" className="text-sm text-destructive">
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="homeCity">Родной город</Label>
              <Input
                id="homeCity"
                name="homeCity"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              name="bio"
              maxLength={200}
              value={bio}
              onChange={(event) => {
                const next = event.target.value.slice(0, 200);
                setBio(next);
                const contact = findContactInBio(next);
                setBioError(
                  contact
                    ? `Контактные данные не допускаются (${contact.kind})`
                    : null,
                );
              }}
            />
            {bioError ? (
              <p className="text-sm text-destructive">{bioError}</p>
            ) : null}
          </div>

          <fieldset
            aria-labelledby="languages-legend"
            className="flex flex-col gap-2"
          >
            <legend
              id="languages-legend"
              className="text-sm font-medium text-foreground"
            >
              Языки
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {languageOptions.map((language) => {
                const checked = selectedLanguages.includes(language.value);
                const checkboxId = `language-${language.value}`;
                return (
                  <Label
                    key={language.value}
                    htmlFor={checkboxId}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-3 py-2 font-normal"
                  >
                    <Checkbox
                      id={checkboxId}
                      name="languages"
                      value={language.value}
                      checked={checked}
                      onCheckedChange={(next) =>
                        toggleLanguage(language.value, next === true)
                      }
                    />
                    <span className="text-sm text-foreground">{language.label}</span>
                  </Label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthYear">Год рождения</Label>
              <Input
                id="birthYear"
                name="birthYear"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" loading={pending} className="self-start">
            Сохранить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
