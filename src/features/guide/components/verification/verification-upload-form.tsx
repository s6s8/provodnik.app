"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DocumentUploadCard } from "./document-upload-card";
import type { UploadedGuideDocument } from "./verification-types";

type VerificationUploadFormProps = {
  initialDocuments: UploadedGuideDocument[];
  actions: {
    getUploadUrl: (
      bucket: string,
      fileName: string,
      mimeType: string,
    ) => Promise<{ path: string; token: string; signedUrl: string }>;
    confirmGuideAssetUpload: (data: {
      bucketId: string;
      objectPath: string;
      assetKind: "guide-document";
      mimeType: string;
      byteSize: number;
    }) => Promise<{ id: string; objectPath: string }>;
    confirmDocumentUpload: (
      assetId: string,
      documentType: "passport" | "selfie" | "certificate",
    ) => Promise<{
      id: string;
      status: "draft" | "submitted" | "approved" | "rejected";
      assetId: string;
      objectPath: string;
    }>;
    submitForVerification: () => Promise<{ status: "submitted" }>;
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
    label: "Сертификат / лицензия",
    required: false,
  },
];

function toDocumentMap(documents: UploadedGuideDocument[]) {
  return new Map(documents.map((document) => [document.documentType, document]));
}

export function VerificationUploadForm({
  initialDocuments,
  actions,
}: VerificationUploadFormProps) {
  const router = useRouter();
  const [documents, setDocuments] = React.useState(() => toDocumentMap(initialDocuments));
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const hasRequiredDocuments =
    documents.has("passport") && documents.has("selfie");

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
      await actions.submitForVerification();
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
  }, [actions, router]);

  return (
    <div className="upload-form-shell">
      <div className="upload-form-summary glass-panel">
        <div className="upload-form-summary__item">
          <ShieldCheck size={18} />
          <span>Загрузите документы в хорошем качестве и без обрезки.</span>
        </div>
        <div className="upload-form-summary__item">
          <Clock3 size={18} />
          <span>Проверка начинается только после кнопки «Отправить на проверку».</span>
        </div>
      </div>

      <div className="upload-grid">
        {verificationSlots.map((slot) => (
          <DocumentUploadCard
            key={slot.documentType}
            label={slot.label}
            required={slot.required}
            documentType={slot.documentType}
            initialDocument={documents.get(slot.documentType) ?? null}
            onUploadComplete={handleUploadComplete}
            onRequestUploadUrl={
              actions.getUploadUrl as VerificationUploadFormProps["actions"]["getUploadUrl"]
            }
            onConfirmAsset={actions.confirmGuideAssetUpload}
            onLinkDocument={actions.confirmDocumentUpload}
          />
        ))}
      </div>

      {submitError ? (
        <div className="upload-alert upload-alert--danger">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      ) : null}

      <div className="upload-submit-row">
        <p className="upload-submit-copy">
          {hasRequiredDocuments
            ? "Обязательные документы загружены. Можно отправлять профиль на проверку."
            : "Кнопка станет активной после загрузки паспорта и селфи с документом."}
        </p>
        <Button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!hasRequiredDocuments || isSubmitting}
        >
          {isSubmitting ? "Отправляем..." : "Отправить на проверку"}
        </Button>
      </div>
    </div>
  );
}
