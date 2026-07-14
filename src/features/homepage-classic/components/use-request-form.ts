"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useController, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createRequestAction } from "@/features/requests/create-request-actions";
import {
  travelerRequestSchema,
  type TravelerRequest,
  type TravelerRequestInput,
} from "@/data/traveler-request/schema";

type FormValues = TravelerRequest;
type FormInput = TravelerRequestInput;

export const REQUEST_DRAFT_KEY = "provodnik:request-draft";

/** What an anonymous visitor typed before the auth gate interrupted them. */
export type RequestDraft = Partial<FormInput>;

// ponytail: sessionStorage only. No drafts table until anonymous multi-device
// resumption is actually asked for.
function draftStorage(): Storage | null {
  try {
    // Absent during SSR; throws outright in Safari private mode / with storage disabled.
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readRequestDraft(): RequestDraft | null {
  try {
    const raw = draftStorage()?.getItem(REQUEST_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as RequestDraft) : null;
  } catch {
    return null;
  }
}

/**
 * Persist the form VALUES, not the FormData object — FormData does not survive
 * a JSON round-trip (it serialises to `{}`).
 */
export function writeRequestDraft(values: RequestDraft): void {
  try {
    draftStorage()?.setItem(REQUEST_DRAFT_KEY, JSON.stringify(values));
  } catch {
    // Quota or disabled storage: the draft is a nicety, never a blocker.
  }
}

export function clearRequestDraft(): void {
  try {
    draftStorage()?.removeItem(REQUEST_DRAFT_KEY);
  } catch {
    // See writeRequestDraft.
  }
}

const DEFAULT_VALUES: FormInput = {
  mode: "assembly",
  interests: [] as TravelerRequest["interests"],
  requestedLanguages: ["Русский"],
  destination: "",
  startDate: "",
  dateFlexibility: "exact",
  startTime: "10:00",
  endTime: "12:00",
  groupSize: 2,
  groupSizeCurrent: 1,
  allowGuideSuggestionsOutsideConstraints: true,
  budgetPerPersonRub: 5000,
  notes: "",
};

export function useRequestForm(options?: { preferredGuideSlug?: string | null }) {
  const preferredGuideSlug = options?.preferredGuideSlug ?? null;
  const router = useRouter();
  const [authGateOpen, setAuthGateOpen] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState<FormData | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Restore the draft an anonymous visitor left behind (reload mid-signup, tab
  // navigation). Read post-mount only — reading sessionStorage during render would
  // desync the SSR markup.
  //
  // It goes through `values`, NOT a `reset()` in an effect. `reset()` updated the form
  // STATE but never wrote back into the registered uncontrolled inputs, so the visitor
  // saw «2 гостей / 5 000 ₽» (the defaults) while the request that got submitted said
  // 4 and 7 000 — shown one trip, sent another, no error anywhere. `values` is RHF's
  // documented channel for data that arrives after mount and syncs both.
  // `keepDirtyValues` preserves anything the visitor has already re-typed.
  const [draft, setDraft] = React.useState<RequestDraft | null>(null);
  React.useEffect(() => {
    setDraft(readRequestDraft());
  }, []);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: DEFAULT_VALUES,
    values: draft ? { ...DEFAULT_VALUES, ...draft } : undefined,
    resetOptions: { keepDirtyValues: true },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form;

  const { field: interestsField } = useController({ control, name: "interests" });
  const { field: requestedLanguagesField } = useController({
    control,
    name: "requestedLanguages",
  });

  const mode = useWatch({ control, name: "mode" });
  const isAssembly = mode === "assembly";
  const dateFlexibility = useWatch({ control, name: "dateFlexibility" });
  const watchedGroupSize = useWatch({ control, name: "groupSize" });
  const watchedBudgetPerPerson = useWatch({ control, name: "budgetPerPersonRub" });
  const selectedInterests = interestsField.value ?? [];

  async function submitWithFormData(fd: FormData, values?: FormValues) {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await createRequestAction({ error: null }, fd);
      // Gate to the auth flow only when the server confirms the caller is not
      // signed in — never on a browser-side getUser() pre-check, which races
      // proxy.ts's cookie refresh and forces spurious re-logins (row #34).
      if (result?.code === "auth_required") {
        setPendingFormData(fd);
        if (values) writeRequestDraft(values);
        setAuthGateOpen(true);
      } else if (result?.error) {
        setServerError(result.error);
      } else {
        clearRequestDraft();
      }
    } finally {
      setIsLoading(false);
    }
  }

  const submit = async (values: FormValues) => {
    const fd = new FormData();
    fd.set("mode", values.mode);
    for (const i of values.interests) {
      fd.append("interests[]", i);
    }
    for (const language of values.requestedLanguages) {
      fd.append("requested_languages[]", language);
    }
    fd.set("destination", values.destination);
    fd.set("startDate", values.startDate);
    fd.set("dateFlexibility", values.dateFlexibility);
    fd.set("startTime", values.startTime ?? "");
    fd.set("endTime", values.endTime ?? "");
    // Unified "Сколько вас" — write to groupSize always; when assembly,
    // mirror into groupSizeCurrent so the action's schema sees a value there too.
    const count = values.groupSize ?? 1;
    fd.set("groupSize", String(count));
    if (values.mode === "assembly") {
      fd.set("groupSizeCurrent", String(count));
    }
    fd.set("budgetPerPersonRub", String(values.budgetPerPersonRub));
    fd.set("notes", values.notes ?? "");
    if (preferredGuideSlug) {
      fd.set("preferredGuideSlug", preferredGuideSlug);
    }

    await submitWithFormData(fd, values);
  };

  const handleAuthSuccess = async () => {
    setAuthGateOpen(false);
    // Refresh server components (SiteHeader, layout) so they pick up the new
    // auth state — without this, mobile hamburger drawer keeps showing "Войти"
    // after a successful in-page login (bug 5bcc6c22).
    router.refresh();
    if (pendingFormData) {
      await submitWithFormData(pendingFormData);
      setPendingFormData(null);
    }
  };

  return {
    form,
    register,
    handleSubmit,
    setValue,
    errors,
    interestsField,
    requestedLanguagesField,
    isAssembly,
    dateFlexibility,
    watchedGroupSize,
    watchedBudgetPerPerson,
    selectedInterests,
    submit,
    authGateOpen,
    setAuthGateOpen,
    handleAuthSuccess,
    serverError,
    isLoading,
  };
}
