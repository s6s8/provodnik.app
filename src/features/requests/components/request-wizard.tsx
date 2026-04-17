"use client";

import * as React from "react";

import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";

import { StepDestination } from "@/features/requests/components/steps/step-destination";
import { StepDetails } from "@/features/requests/components/steps/step-details";
import { StepInterests } from "@/features/requests/components/steps/step-interests";

type WizardData = {
  // Step 1
  destination: string; // required
  startDate: string; // required (YYYY-MM-DD)
  endDate: string; // defaults to startDate if not changed
  groupSize: number; // 1–20, default 2

  // Step 2
  interests: string[]; // multi-select, at least 1 required
  budgetKey: "under2k" | "under5k" | "under10k" | "unlimited"; // default 'under5k'
  budgetPerPerson: boolean; // true = per person (default), false = total group
  formatPref: "private" | "group" | "any"; // default 'any'

  // Step 3
  notes: string; // optional
};

const stepTitles = ["Куда и когда", "Интересы", "Подробности"] as const;

const defaultData: WizardData = {
  destination: "",
  startDate: "",
  endDate: "",
  groupSize: 2,
  interests: [],
  budgetKey: "under5k",
  budgetPerPerson: true,
  formatPref: "any",
  notes: "",
};

const interestToCategoryMap: Record<string, string> = {
  history: "city",
  architecture: "city",
  nature: "nature",
  food: "food",
  art: "culture",
  adventure: "adventure",
  photo: "adventure",
  kids: "relax",
  unusual: "relax",
  nightlife: "relax",
};

const budgetMap = {
  under2k: 2000,
  under5k: 5000,
  under10k: 10000,
  unlimited: 100000,
} as const;

export function RequestWizard() {
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);
  const [data, setData] = React.useState<WizardData>(defaultData);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const patchData = React.useCallback((patch: Partial<WizardData>) => {
    setServerError(null);
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = React.useCallback(() => {
    setServerError(null);

    const experienceType =
      interestToCategoryMap[data.interests[0] ?? ""] ?? "city";
    const budgetPerPersonRub = budgetMap[data.budgetKey];

    const groupPreference = data.formatPref === "private" ? "private" : "group";
    const openToJoiningOthers = data.formatPref === "group";

    const fd = new FormData();
    fd.set("experienceType", experienceType);
    fd.set("destination", data.destination);
    fd.set("startDate", data.startDate);
    fd.set("endDate", data.endDate || data.startDate);
    fd.set("groupSize", String(data.groupSize));
    fd.set("groupPreference", groupPreference);
    fd.set("openToJoiningOthers", String(openToJoiningOthers));
    fd.set("allowGuideSuggestionsOutsideConstraints", "true");
    fd.set("budgetPerPersonRub", String(budgetPerPersonRub));
    fd.set("budgetPerPerson", String(data.budgetPerPerson));
    fd.set("notes", data.notes ?? "");
    // Append interests for server-side use (future schema extension)
    for (const interest of data.interests) {
      fd.append("interests[]", interest);
    }

    startTransition(async () => {
      const result = await createRequestAction({ error: null }, fd);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Шаг {currentStep} из 3</span>
          <span>{stepTitles[currentStep - 1]}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {currentStep === 1 ? (
        <StepDestination
          data={{
            destination: data.destination,
            startDate: data.startDate,
            endDate: data.endDate,
            groupSize: data.groupSize,
          }}
          onChange={patchData}
          onNext={() => {
            if (data.destination.trim().length < 2) return;
            if (!data.startDate) return;
            setCurrentStep(2);
          }}
        />
      ) : null}

      {currentStep === 2 ? (
        <StepInterests
          data={{
            interests: data.interests,
            budgetKey: data.budgetKey,
            budgetPerPerson: data.budgetPerPerson,
            formatPref: data.formatPref,
          }}
          onChange={patchData}
          onBack={() => setCurrentStep(1)}
          onNext={() => {
            if (data.interests.length < 1) return;
            setCurrentStep(3);
          }}
        />
      ) : null}

      {currentStep === 3 ? (
        <StepDetails
          data={data}
          isSubmitting={isPending}
          serverError={serverError}
          onChange={patchData}
          onBack={() => setCurrentStep(2)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

