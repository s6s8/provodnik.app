"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock3, ShieldCheck } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import type { GuideVerificationStatusDb } from "@/lib/supabase/types";
import type {
  SubmitVerificationResult,
  VerificationAssetConfirmResult,
  VerificationDocumentLinkResult,
  VerificationUploadUrlResult,
} from "@/features/guide/verification-action-types";
import { DocumentUploadCard } from "./document-upload-card";
import type { UploadedGuideDocument } from "./verification-types";

type VerificationUploadFormProps = {
  initialDocuments: UploadedGuideDocument[];
  verificationStatus?: GuideVerificationStatusDb | null;
  isAnketaComplete?: boolean;
  actions: {
    getUploadUrl: (
      bucket: string,
      fileName: string,
      mimeType: string,
    ) => Promise<VerificationUploadUrlResult>;
    confirmGuideAssetUpload: (data: {
      bucketId: string;
      objectPath: string;
      assetKind: "guide-document";
      mimeType: string;
      byteSize: number;
    }) => Promise<VerificationAssetConfirmResult>;
    confirmDocumentUpload: (
      assetId: string,
      documentType: "passport" | "selfie" | "certificate",
    ) => Promise<VerificationDocumentLinkResult>;
    listDocuments?: () => Promise<UploadedGuideDocument[]>;
    submitForVerification: () => Promise<SubmitVerificationResult>;
  };
};

const verificationSlots = [
  { documentType: "passport" as const, label: "Паспорт", required: true },
  {
    documentType: "selfie" as const,
    label: "Селфи с документом",
    required: true,
  },
  {
    documentType: "certificate" as const,
    label: "Сертификат / аттестат",
    required: false,
  },
];

function toDocumentMap(documents: UploadedGuideDocument[]) {
  return new Map(documents.map((document) => [document.documentType, document]));
}

function hasRequiredLinkedDocuments(documents: Map<string, UploadedGuideDocument>) {
  return documents.has("passport") && documents.has("selfie");
}

export function VerificationUploadForm({
  initialDocuments,
  verificationStatus = null,
  isAnketaComplete = false,
  actions,
}: VerificationUploadFormProps) {
  const router = useRouter();
  const [documents, setDocuments] = React.useState(() => toDocumentMap(initialDocuments));
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const hasRequiredDocuments = hasRequiredLinkedDocuments(documents);
  const canSubmit = hasRequiredDocuments && isAnketaComplete;

  const handleUploadComplete = React.useCallback((document: UploadedGuideDocument) => {
    setDocuments((current) => {
      const next = new Map(current);
      next.set(document.documentType, document);
      return next;
    });
  }, []);

  const handleSubmit = React.useCallback(async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let latestDocuments = documents;
      if (actions.listDocuments) {
        const refreshedDocuments = await actions.listDocuments();
        latestDocuments = toDocumentMap(refreshedDocuments);
        setDocuments(latestDocuments);
      }

      if (!hasRequiredLinkedDocuments(latestDocuments)) {
        setSubmitError("Загрузите паспорт и селфи с документом перед отправкой.");
        return;
      }

      const result = await actions.submitForVerification();
      if ("error" in result) {
        setSubmitError(result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Не удалось отправить документы на проверку.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [actions, documents, router]);

  return (
    <div className="grid gap-6">
      <GlassCard className="grid gap-3 p-5">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldCheck size={18} />
          <span>Загрузите документы в хорошем качестве и без обрезки.</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Clock3 size={18} />
          <span>
            Проверка начинается только после кнопки «Отправить на проверку» и
            обычно занимает 1–2 рабочих дня. После одобрения профиль и
            объявления становятся видны путешественникам, и вы начинаете
            получать заявки.
          </span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {verificationSlots.map((slot) => (
          <DocumentUploadCard
            key={slot.documentType}
            label={slot.label}
            required={slot.required}
            documentType={slot.documentType}
            verificationStatus={verificationStatus}
            initialDocument={documents.get(slot.documentType) ?? null}
            onUploadComplete={handleUploadComplete}
            onRequestUploadUrl={actions.getUploadUrl}
            onConfirmAsset={actions.confirmGuideAssetUpload}
            onLinkDocument={actions.confirmDocumentUpload}
          />
        ))}
      </div>

      {submitError ? (
        <div className="flex items-start gap-3 rounded-[1rem] bg-destructive/10 px-4 py-3.5 text-destructive">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-[0.9375rem] leading-[1.65] text-muted-foreground">
          {!isAnketaComplete
            ? "Заполните анкету полностью, чтобы отправить на проверку."
            : hasRequiredDocuments
              ? "Обязательные документы загружены. Можно отправлять профиль на проверку."
              : "Кнопка станет активной после загрузки паспорта и селфи с документом."}
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Отправляем..." : "Отправить на проверку"}
        </Button>
      </div>
    </div>
  );
}
