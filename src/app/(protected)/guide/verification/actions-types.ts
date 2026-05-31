export type VerificationUploadUrlResult =
  | { ok: true; path: string; token: string; signedUrl: string }
  | { error: string };

export type VerificationAssetConfirmResult =
  | { ok: true; id: string; objectPath: string; mimeType: string; byteSize: number }
  | { error: string };

export type VerificationDocumentLinkResult =
  | {
      ok: true;
      id: string;
      documentType: string;
      status: string;
      assetId: string;
      objectPath: string;
    }
  | { error: string };

export type SubmitVerificationResult =
  | { ok: true; status: "submitted" }
  | { error: string };
