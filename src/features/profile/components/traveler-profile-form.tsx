"use client";

import { useState } from "react";

import { updateTravelerProfile } from "@/app/(protected)/profile/personal/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { findContactInBio } from "../validation/anti-contact";

export type TravelerProfile = {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_city: string | null;
  languages: string[] | null;
  birth_year: number | null;
};

const languageOptions = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export function TravelerProfileForm({ profile }: { profile: TravelerProfile }) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const result = await updateTravelerProfile(formData);
    if (!result.ok) setError(result.error);
  }

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-6">
        <form action={onSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.full_name ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeCity">Родной город</Label>
              <Input
                id="homeCity"
                name="homeCity"
                defaultValue={profile.home_city ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
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

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="languages">Языки</Label>
              <select
                id="languages"
                name="languages"
                multiple
                defaultValue={profile.languages ?? []}
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {languageOptions.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthYear">Год рождения</Label>
              <Input
                id="birthYear"
                name="birthYear"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                defaultValue={profile.birth_year ?? ""}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit">Сохранить</Button>
        </form>
      </CardContent>
    </Card>
  );
}
