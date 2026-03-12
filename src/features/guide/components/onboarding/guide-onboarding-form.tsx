"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import {
  guideExperienceLevels,
  guideGovIdTypes,
  guideOnboardingSchema,
  type GuideOnboardingValues,
} from "@/features/guide/utils/guide-onboarding-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AuthContext } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  GuideProfileRow,
  GuideVerificationStatusDb,
} from "@/lib/supabase/types";

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatGovIdType(value: (typeof guideGovIdTypes)[number]): string {
  switch (value) {
    case "passport":
      return "Passport";
    case "national_id":
      return "National ID";
    case "drivers_license":
      return "Driver's license";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

function formatExperienceLevel(
  value: (typeof guideExperienceLevels)[number]
): string {
  switch (value) {
    case "starter":
      return "Starter";
    case "intermediate":
      return "Intermediate";
    case "expert":
      return "Expert";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

type GuideOnboardingFormProps = {
  auth: AuthContext;
};

export function GuideOnboardingForm({ auth }: GuideOnboardingFormProps) {
  const [submitted, setSubmitted] = React.useState<GuideOnboardingValues | null>(
    null
  );
  const [persistedToBackend, setPersistedToBackend] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string | null>(null);

  const canPersistToSupabase =
    auth.hasSupabaseEnv && auth.isAuthenticated && auth.source === "supabase";

  const form = useForm<GuideOnboardingValues>({
    resolver: zodResolver(guideOnboardingSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      bio: "",
      regions: [],
      languages: [],
      specialties: [],
      experienceLevel: "starter",
      yearsExperience: 0,
      currentBaseCity: "",
      groupSizeMax: 6,
      hasFirstAidTraining: false,
      acceptsPrivateTours: true,
      acceptsGroupTours: false,
      legalName: "",
      birthDate: "",
      citizenshipCountry: "",
      govIdType: "passport",
      govIdLast4: "",
      addressLine1: "",
      addressCity: "",
      addressCountry: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      referenceName1: "",
      referenceContact1: "",
      referenceName2: "",
      referenceContact2: "",
      consentBackgroundCheck: false,
      attestTruthful: false,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = form;

  const onSubmit = React.useCallback(async (values: GuideOnboardingValues) => {
    setBackendError(null);

    if (canPersistToSupabase) {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!user || userError) {
          setPersistedToBackend(false);
          setBackendError(
            "Session is not available; saved locally only in this browser."
          );
          setSubmitted(values);
          return;
        }

        const verificationStatus: GuideVerificationStatusDb =
          values.consentBackgroundCheck && values.attestTruthful
            ? "submitted"
            : "draft";

        const verificationNotesParts: string[] = [
          `Base city: ${values.currentBaseCity}`,
          `Regions: ${values.regions.join(", ")}`,
          `Languages: ${values.languages.join(", ")}`,
          `Specialties: ${values.specialties.join(", ")}`,
          `Years experience: ${values.yearsExperience}`,
          `Max group size: ${values.groupSizeMax}`,
          `First aid training: ${values.hasFirstAidTraining ? "yes" : "no"}`,
          `Accepts private tours: ${values.acceptsPrivateTours ? "yes" : "no"}`,
          `Accepts group tours: ${values.acceptsGroupTours ? "yes" : "no"}`,
          `Emergency contact: ${values.emergencyContactName} / ${values.emergencyContactPhone}`,
          `References: ${values.referenceName1} / ${values.referenceContact1}; ${values.referenceName2} / ${values.referenceContact2}`,
          `Background check consent: ${
            values.consentBackgroundCheck ? "yes" : "no"
          }`,
          `Attestation: ${values.attestTruthful ? "yes" : "no"}`,
        ];

        const payload: Partial<GuideProfileRow> = {
          user_id: user.id,
          display_name: values.displayName,
          bio: values.bio,
          years_experience: values.yearsExperience,
          regions: values.regions,
          languages: values.languages,
          specialties: values.specialties,
          verification_status: verificationStatus,
          verification_notes: verificationNotesParts.join(" | "),
        };

        const { error: upsertError } = await supabase
          .from("guide_profiles")
          .upsert(payload, { onConflict: "user_id" });

        if (upsertError) {
          setPersistedToBackend(false);
          setBackendError(
            "We could not reach the backend; saved locally only in this browser."
          );
          setSubmitted(values);
          return;
        }

        setPersistedToBackend(true);
      } catch (error) {
        console.error("Failed to persist guide onboarding to Supabase", error);
        setPersistedToBackend(false);
        setBackendError(
          "We could not reach the backend; saved locally only in this browser."
        );
        setSubmitted(values);
        return;
      }
    } else {
      setPersistedToBackend(false);
    }

    setSubmitted(values);
  }, [canPersistToSupabase]);

  const handleStartOver = React.useCallback(() => {
    setSubmitted(null);
    reset();
  }, [reset]);

  const regions = useWatch({ control, name: "regions" }) ?? [];
  const languages = useWatch({ control, name: "languages" }) ?? [];
  const specialties = useWatch({ control, name: "specialties" }) ?? [];

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Onboarding captured locally</CardTitle>
              <p className="text-sm text-muted-foreground">
                {persistedToBackend
                  ? "Your intake has been written to your guide profile in Supabase. You can review the captured intake below."
                  : "For this session, the full intake is stored locally in this browser. You can review the captured intake below."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <SummarySection title="Profile basics">
              <SummaryRow label="Display name" value={submitted.displayName} />
              <SummaryRow label="Tagline" value={submitted.tagline} />
              <SummaryRow label="Bio" value={submitted.bio} />
              <SummaryRow
                label="Regions"
                value={submitted.regions.length ? submitted.regions.join(", ") : "-"}
              />
              <SummaryRow
                label="Languages"
                value={
                  submitted.languages.length ? submitted.languages.join(", ") : "-"
                }
              />
              <SummaryRow
                label="Specialties"
                value={
                  submitted.specialties.length
                    ? submitted.specialties.join(", ")
                    : "-"
                }
              />
            </SummarySection>

            <SummarySection title="Operating details">
              <SummaryRow
                label="Experience level"
                value={formatExperienceLevel(submitted.experienceLevel)}
              />
              <SummaryRow
                label="Years of experience"
                value={`${submitted.yearsExperience}`}
              />
              <SummaryRow label="Base city" value={submitted.currentBaseCity} />
              <SummaryRow
                label="Max group size"
                value={`${submitted.groupSizeMax}`}
              />
              <SummaryRow
                label="First aid training"
                value={submitted.hasFirstAidTraining ? "Yes" : "No"}
              />
              <SummaryRow
                label="Accepts private tours"
                value={submitted.acceptsPrivateTours ? "Yes" : "No"}
              />
              <SummaryRow
                label="Accepts group tours"
                value={submitted.acceptsGroupTours ? "Yes" : "No"}
              />
            </SummarySection>

            <SummarySection title="Identity & verification">
              <SummaryRow label="Legal name" value={submitted.legalName} />
              <SummaryRow label="Birth date" value={submitted.birthDate} />
              <SummaryRow
                label="Citizenship country"
                value={submitted.citizenshipCountry}
              />
              <SummaryRow
                label="Government ID type"
                value={formatGovIdType(submitted.govIdType)}
              />
              <SummaryRow label="Gov ID last 4" value={submitted.govIdLast4} />
              <SummaryRow label="Address line 1" value={submitted.addressLine1} />
              <SummaryRow label="Address city" value={submitted.addressCity} />
              <SummaryRow label="Address country" value={submitted.addressCountry} />
              <SummaryRow
                label="Emergency contact"
                value={`${submitted.emergencyContactName} / ${submitted.emergencyContactPhone}`}
              />
            </SummarySection>

            <SummarySection title="References">
              <SummaryRow
                label="Reference 1"
                value={`${submitted.referenceName1} / ${submitted.referenceContact1}`}
              />
              <SummaryRow
                label="Reference 2"
                value={`${submitted.referenceName2} / ${submitted.referenceContact2}`}
              />
            </SummarySection>

            <SummarySection title="Consents">
              <div className="grid gap-2 rounded-lg border border-border/70 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Verification intake confirmed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Background check consent:{" "}
                  <span className="font-medium text-foreground">
                    {submitted.consentBackgroundCheck ? "Yes" : "No"}
                  </span>
                  . Attestation:{" "}
                  <span className="font-medium text-foreground">
                    {submitted.attestTruthful ? "Yes" : "No"}
                  </span>
                  .
                </p>
              </div>
            </SummarySection>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={handleStartOver}>
            Start over
            <RotateCcw className="size-4" />
          </Button>
          {backendError ? (
            <p className="text-sm text-muted-foreground sm:ml-2">{backendError}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Guide onboarding and verification intake"
    >
      <SectionHeader
        badge="Profile basics"
        title="Public profile"
        description="What travelers will see when browsing your guide profile."
      />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <Input
            id="displayName"
            placeholder="e.g. Amina K."
            autoComplete="nickname"
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? "displayName-error" : undefined}
            {...register("displayName")}
          />
          <FieldHint>Use the name travelers should recognize.</FieldHint>
          <FieldError id="displayName-error" message={errors.displayName?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="tagline">Tagline</FieldLabel>
          <Input
            id="tagline"
            placeholder="e.g. Calm city walks + hidden cafes"
            autoComplete="off"
            aria-invalid={Boolean(errors.tagline)}
            aria-describedby={errors.tagline ? "tagline-error" : undefined}
            {...register("tagline")}
          />
          <FieldHint>One short sentence that fits in a card.</FieldHint>
          <FieldError id="tagline-error" message={errors.tagline?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            placeholder="Tell travelers what you love guiding, your approach, and what they can expect."
            aria-invalid={Boolean(errors.bio)}
            aria-describedby={errors.bio ? "bio-error" : undefined}
            {...register("bio")}
          />
          <FieldHint>40+ characters. Keep it friendly and concrete.</FieldHint>
          <FieldError id="bio-error" message={errors.bio?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="regions">Regions</FieldLabel>
            <Input
              id="regions"
              placeholder="e.g. Moscow, Kazan, Altai"
              autoComplete="off"
              aria-invalid={Boolean(errors.regions)}
              aria-describedby={errors.regions ? "regions-error" : undefined}
              value={regions.join(", ")}
              onChange={(event) => {
                setValue("regions", splitCommaList(event.target.value), {
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
            <FieldHint>Comma-separated list. At least one required.</FieldHint>
            <FieldError
              id="regions-error"
              message={typeof errors.regions?.message === "string" ? errors.regions.message : undefined}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="languages">Languages</FieldLabel>
            <Input
              id="languages"
              placeholder="e.g. English, Russian"
              autoComplete="off"
              aria-invalid={Boolean(errors.languages)}
              aria-describedby={errors.languages ? "languages-error" : undefined}
              value={languages.join(", ")}
              onChange={(event) => {
                setValue("languages", splitCommaList(event.target.value), {
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
            <FieldHint>Comma-separated list. At least one required.</FieldHint>
            <FieldError
              id="languages-error"
              message={
                typeof errors.languages?.message === "string"
                  ? errors.languages.message
                  : undefined
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="specialties">Specialties</FieldLabel>
          <Input
            id="specialties"
            placeholder="e.g. history, street food, nature hikes"
            autoComplete="off"
            aria-invalid={Boolean(errors.specialties)}
            aria-describedby={errors.specialties ? "specialties-error" : undefined}
            value={specialties.join(", ")}
            onChange={(event) => {
              setValue("specialties", splitCommaList(event.target.value), {
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          />
          <FieldHint>Comma-separated list. At least one required.</FieldHint>
          <FieldError
            id="specialties-error"
            message={
              typeof errors.specialties?.message === "string"
                ? errors.specialties.message
                : undefined
            }
          />
        </div>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Operating details"
        title="How you run tours"
        description="Set expectations for availability, group size, and formats."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="experienceLevel">Experience level</FieldLabel>
            <select
              id="experienceLevel"
              aria-invalid={Boolean(errors.experienceLevel)}
              aria-describedby={
                errors.experienceLevel ? "experienceLevel-error" : undefined
              }
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              {...register("experienceLevel")}
            >
              {guideExperienceLevels.map((level) => (
                <option key={level} value={level}>
                  {formatExperienceLevel(level)}
                </option>
              ))}
            </select>
            <FieldError
              id="experienceLevel-error"
              message={errors.experienceLevel?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="yearsExperience">Years of experience</FieldLabel>
            <Input
              id="yearsExperience"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              aria-invalid={Boolean(errors.yearsExperience)}
              aria-describedby={
                errors.yearsExperience ? "yearsExperience-error" : undefined
              }
              {...register("yearsExperience", { valueAsNumber: true })}
            />
            <FieldError
              id="yearsExperience-error"
              message={errors.yearsExperience?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="currentBaseCity">Base city</FieldLabel>
            <Input
              id="currentBaseCity"
              placeholder="e.g. Saint Petersburg"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.currentBaseCity)}
              aria-describedby={
                errors.currentBaseCity ? "currentBaseCity-error" : undefined
              }
              {...register("currentBaseCity")}
            />
            <FieldHint>Where you start most tours.</FieldHint>
            <FieldError
              id="currentBaseCity-error"
              message={errors.currentBaseCity?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="groupSizeMax">Max group size</FieldLabel>
            <Input
              id="groupSizeMax"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              aria-invalid={Boolean(errors.groupSizeMax)}
              aria-describedby={errors.groupSizeMax ? "groupSizeMax-error" : undefined}
              {...register("groupSizeMax", { valueAsNumber: true })}
            />
            <FieldHint>For MVP baseline, cap at 50.</FieldHint>
            <FieldError id="groupSizeMax-error" message={errors.groupSizeMax?.message} />
          </div>
        </div>

        <fieldset className="grid gap-2" aria-label="Operating options">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("hasFirstAidTraining")} />
            <span>
              <span className="font-medium text-foreground">First aid training</span>
              <span className="block text-xs text-muted-foreground">
                Let travelers know you have valid first aid training.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("acceptsPrivateTours")} />
            <span>
              <span className="font-medium text-foreground">Accept private tours</span>
              <span className="block text-xs text-muted-foreground">
                You can run experiences for one party.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("acceptsGroupTours")} />
            <span>
              <span className="font-medium text-foreground">Accept group tours</span>
              <span className="block text-xs text-muted-foreground">
                You can combine multiple travelers into one group.
              </span>
            </span>
          </label>
        </fieldset>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Identity & verification"
        title="Verification intake"
        description="Required to run paid tours. For now, captured locally on this device."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="legalName">Legal name</FieldLabel>
            <Input
              id="legalName"
              placeholder="As shown on your ID"
              autoComplete="name"
              aria-invalid={Boolean(errors.legalName)}
              aria-describedby={errors.legalName ? "legalName-error" : undefined}
              {...register("legalName")}
            />
            <FieldError id="legalName-error" message={errors.legalName?.message} />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="birthDate">Birth date</FieldLabel>
            <Input
              id="birthDate"
              type="date"
              aria-invalid={Boolean(errors.birthDate)}
              aria-describedby={errors.birthDate ? "birthDate-error" : undefined}
              {...register("birthDate")}
            />
            <FieldError id="birthDate-error" message={errors.birthDate?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="citizenshipCountry">Citizenship country</FieldLabel>
            <Input
              id="citizenshipCountry"
              placeholder="e.g. Russia"
              autoComplete="country"
              aria-invalid={Boolean(errors.citizenshipCountry)}
              aria-describedby={
                errors.citizenshipCountry ? "citizenshipCountry-error" : undefined
              }
              {...register("citizenshipCountry")}
            />
            <FieldError
              id="citizenshipCountry-error"
              message={errors.citizenshipCountry?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="govIdType">Government ID type</FieldLabel>
            <select
              id="govIdType"
              aria-invalid={Boolean(errors.govIdType)}
              aria-describedby={errors.govIdType ? "govIdType-error" : undefined}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              {...register("govIdType")}
            >
              {guideGovIdTypes.map((type) => (
                <option key={type} value={type}>
                  {formatGovIdType(type)}
                </option>
              ))}
            </select>
            <FieldError id="govIdType-error" message={errors.govIdType?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="govIdLast4">Gov ID last 4 digits</FieldLabel>
            <Input
              id="govIdLast4"
              placeholder="1234"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(errors.govIdLast4)}
              aria-describedby={errors.govIdLast4 ? "govIdLast4-error" : undefined}
              {...register("govIdLast4")}
            />
            <FieldHint>Do not enter the full document number.</FieldHint>
            <FieldError id="govIdLast4-error" message={errors.govIdLast4?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
            <Input
              id="addressLine1"
              placeholder="Street address"
              autoComplete="street-address"
              aria-invalid={Boolean(errors.addressLine1)}
              aria-describedby={errors.addressLine1 ? "addressLine1-error" : undefined}
              {...register("addressLine1")}
            />
            <FieldError id="addressLine1-error" message={errors.addressLine1?.message} />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="addressCity">City</FieldLabel>
            <Input
              id="addressCity"
              placeholder="City"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.addressCity)}
              aria-describedby={errors.addressCity ? "addressCity-error" : undefined}
              {...register("addressCity")}
            />
            <FieldError id="addressCity-error" message={errors.addressCity?.message} />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="addressCountry">Country</FieldLabel>
            <Input
              id="addressCountry"
              placeholder="Country"
              autoComplete="country"
              aria-invalid={Boolean(errors.addressCountry)}
              aria-describedby={errors.addressCountry ? "addressCountry-error" : undefined}
              {...register("addressCountry")}
            />
            <FieldError
              id="addressCountry-error"
              message={errors.addressCountry?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="emergencyContactName">Emergency contact name</FieldLabel>
            <Input
              id="emergencyContactName"
              placeholder="Full name"
              autoComplete="off"
              aria-invalid={Boolean(errors.emergencyContactName)}
              aria-describedby={
                errors.emergencyContactName ? "emergencyContactName-error" : undefined
              }
              {...register("emergencyContactName")}
            />
            <FieldError
              id="emergencyContactName-error"
              message={errors.emergencyContactName?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="emergencyContactPhone">
              Emergency contact phone
            </FieldLabel>
            <Input
              id="emergencyContactPhone"
              placeholder="+7 999 000-00-00"
              autoComplete="tel"
              aria-invalid={Boolean(errors.emergencyContactPhone)}
              aria-describedby={
                errors.emergencyContactPhone ? "emergencyContactPhone-error" : undefined
              }
              {...register("emergencyContactPhone")}
            />
            <FieldError
              id="emergencyContactPhone-error"
              message={errors.emergencyContactPhone?.message}
            />
          </div>
        </div>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="References"
        title="Professional references"
        description="Two people who can vouch for your guiding experience."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceName1">Reference 1 name</FieldLabel>
            <Input
              id="referenceName1"
              placeholder="Full name"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceName1)}
              aria-describedby={errors.referenceName1 ? "referenceName1-error" : undefined}
              {...register("referenceName1")}
            />
            <FieldError
              id="referenceName1-error"
              message={errors.referenceName1?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceContact1">Reference 1 contact</FieldLabel>
            <Input
              id="referenceContact1"
              placeholder="Phone, email, or link"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceContact1)}
              aria-describedby={
                errors.referenceContact1 ? "referenceContact1-error" : undefined
              }
              {...register("referenceContact1")}
            />
            <FieldError
              id="referenceContact1-error"
              message={errors.referenceContact1?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceName2">Reference 2 name</FieldLabel>
            <Input
              id="referenceName2"
              placeholder="Full name"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceName2)}
              aria-describedby={errors.referenceName2 ? "referenceName2-error" : undefined}
              {...register("referenceName2")}
            />
            <FieldError
              id="referenceName2-error"
              message={errors.referenceName2?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceContact2">Reference 2 contact</FieldLabel>
            <Input
              id="referenceContact2"
              placeholder="Phone, email, or link"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceContact2)}
              aria-describedby={
                errors.referenceContact2 ? "referenceContact2-error" : undefined
              }
              {...register("referenceContact2")}
            />
            <FieldError
              id="referenceContact2-error"
              message={errors.referenceContact2?.message}
            />
          </div>
        </div>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Consents"
        title="Consent and attestation"
        description="Required to proceed with verification."
      />

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("consentBackgroundCheck")} />
            <span>
              <span className="font-medium text-foreground">
                I consent to a background check
              </span>
              <span className="block text-xs text-muted-foreground">
                This is required before accepting paid bookings.
              </span>
            </span>
          </label>
          <FieldError
            id="consentBackgroundCheck-error"
            message={errors.consentBackgroundCheck?.message}
          />
        </div>

        <div className="grid gap-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("attestTruthful")} />
            <span>
              <span className="font-medium text-foreground">
                I attest the information provided is truthful
              </span>
              <span className="block text-xs text-muted-foreground">
                Providing false information may result in removal from the
                marketplace.
              </span>
            </span>
          </label>
          <FieldError id="attestTruthful-error" message={errors.attestTruthful?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Review carefully - verification fields are product-critical.
        </p>
        <Button type="submit" disabled={isSubmitting}>
          Submit intake (local)
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{badge}</Badge>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FieldLabel(props: React.ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cn("text-sm font-medium text-foreground", props.className)}
    />
  );
}

function FieldHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p {...props} className={cn("text-xs text-muted-foreground", className)} />
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

