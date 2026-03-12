export type GuideGovIdType = "passport" | "national_id" | "drivers_license";

export type GuideExperienceLevel = "starter" | "intermediate" | "expert";

export type GuideOnboardingData = {
  displayName: string;
  tagline: string;
  bio: string;
  regions: string[];
  languages: string[];
  specialties: string[];
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

