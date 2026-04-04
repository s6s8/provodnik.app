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
    <div className="grid gap-6">
      <div className="grid gap-3 rounded-glass border border-glass-border bg-glass p-5 shadow-glass backdrop-blur-[20px]">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldCheck size={18} />
          <span>Загрузите документы в хорошем качестве и без обрезки.</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Clock3 size={18} />
          <span>Проверка начинается только после кнопки «Отправить на проверку».</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex items-start gap-3 rounded-[1rem] bg-destructive/10 px-4 py-3.5 text-destructive">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-[0.9375rem] leading-[1.65] text-muted-foreground">
          {hasRequiredDocuments
            ? "Обязательные документы загружены. Можно отправлять профиль на проверку."
            : "Кнопка станет активной после загрузки паспорта и селфи с документом."}
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!hasRequiredDocuments || isSubmitting}
        >
          {isSubmitting ? "Отправляем..." : "Отправить на проверку"}
        </Button>
      </div>
    </div>
  );
}
