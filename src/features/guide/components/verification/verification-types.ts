import type { GuideVerificationStatusDb } from "@/lib/supabase/types";

export const guideVerificationDocumentTypes = [
  "passport",
  "selfie",
  "certificate",
] as const;

export type GuideVerificationDocumentType =
  (typeof guideVerificationDocumentTypes)[number];

export type UploadedGuideDocument = {
  assetId: string;
  documentType: GuideVerificationDocumentType;
  objectPath: string;
  fileName: string;
  status: GuideVerificationStatusDb;
};
