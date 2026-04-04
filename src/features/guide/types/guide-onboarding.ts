import type {
  GuideProfileRow,
  GuideVerificationStatusDb,
} from "@/lib/supabase/types";

export type GuideGovIdType = "passport" | "national_id" | "drivers_license";

export type GuideExperienceLevel = "starter" | "intermediate" | "expert";

export type GuideOnboardingPersistedProfile = Pick<
  GuideProfileRow,
  | "user_id"
  | "display_name"
  | "bio"
  | "years_experience"
  | "specialization"
  | "regions"
  | "languages"
  | "specialties"
  | "is_available"
  | "verification_status"
  | "verification_notes"
>;

export type GuideOnboardingSubmitMode = "backend" | "demo";

export type GuideOnboardingSubmitState = {
  mode: GuideOnboardingSubmitMode;
  verificationStatus: GuideVerificationStatusDb;
};

export type GuideOnboardingData = {
  displayName: string;
  tagline: string;
  bio: string;
  regions: string[];
  languages: string[];
  specialties: string[];
  isAvailable: boolean;
  experienceLevel: GuideExperienceLevel;
  yearsExperience: number;
  currentBaseCity: string;
  groupSizeMax: number;
  hasFirstAidTraining: boolean;
  acceptsPrivateTours: boolean;
  acceptsGroupTours: boolean;
  legalName: string;
  birthDate: string;
  citizenshipCountry: string;
  govIdType: GuideGovIdType;
  govIdLast4: string;
  addressLine1: string;
  addressCity: string;
  addressCountry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  referenceName1: string;
  referenceContact1: string;
  referenceName2: string;
  referenceContact2: string;
  consentBackgroundCheck: boolean;
  attestTruthful: boolean;
};

