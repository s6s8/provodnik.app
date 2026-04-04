import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideVerificationStatusDb } from "@/lib/supabase/types";
import {
  confirmDocumentUpload,
  confirmGuideAssetUpload,
  getUploadUrl,
  submitForVerification,
} from "./actions";
import { VerificationUploadForm } from "@/features/guide/components/verification/verification-upload-form";
import type { UploadedGuideDocument } from "@/features/guide/components/verification/verification-types";
import { cn } from "@/lib/utils";

type GuideVerificationDocumentRow = {
  id: string;
  document_type: UploadedGuideDocument["documentType"];
  status: GuideVerificationStatusDb;
  storage_assets:
    | { id: string; object_path: string }
    | Array<{ id: string; object_path: string }>;
};

function getStorageAsset(
  relation: GuideVerificationDocumentRow["storage_assets"],
) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function getStatusBadgeClass(status: GuideVerificationStatusDb) {
  return cn(
    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-low text-xs font-semibold text-muted-foreground",
    status === "approved" && "bg-success/12 text-success",
    status === "submitted" && "bg-primary/12 text-primary",
    status === "rejected" && "bg-destructive/12 text-destructive",
  );
}

export default async function GuideVerificationPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth");
  }

  const guideId = session.user.id;

  const [{ data: guideProfile }, { data: guideDocuments }] = await Promise.all([
    supabase
      .from("guide_profiles")
      .select("verification_status, verification_notes")
      .eq("user_id", guideId)
      .maybeSingle(),
    supabase
      .from("guide_documents")
      .select(
        "id, document_type, status, storage_assets!inner(id, object_path)",
      )
      .eq("guide_id", guideId)
      .order("created_at", { ascending: false }),
  ]);

  const verificationStatus = guideProfile?.verification_status ?? "draft";
  const verificationNotes = guideProfile?.verification_notes;

  const documents = ((guideDocuments ?? []) as GuideVerificationDocumentRow[])
    .map((row) => {
      const asset = getStorageAsset(row.storage_assets);
      if (!asset) {
        return null;
      }

      return {
        assetId: asset.id,
        documentType: row.document_type,
        objectPath: asset.object_path,
        fileName: asset.object_path.split("/").at(-1) ?? asset.object_path,
        status: row.status,
      };
    })
    .filter((item): item is UploadedGuideDocument => Boolean(item));

  if (verificationStatus === "approved") {
    return (
      <section className="py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid gap-6">
            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-[clamp(1.25rem,3vw,1.75rem)]">
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Верификация</p>
              <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">Ваш аккаунт верифицирован</h1>
              <div className="flex items-center gap-3 my-4">
                <span className={getStatusBadgeClass("approved")}>Подтверждено</span>
              </div>
              <p className="text-[0.9375rem] leading-[1.65] text-muted-foreground">
                Профиль прошёл проверку. Теперь путешественники увидят, что вы
                подтвердили документы.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (verificationStatus === "submitted") {
    return (
      <section className="py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid gap-6">
            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-[clamp(1.25rem,3vw,1.75rem)]">
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Верификация</p>
              <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">Документы на проверке</h1>
              <div className="flex items-center gap-3 my-4">
                <span className={getStatusBadgeClass("submitted")}>На проверке</span>
              </div>
              <p className="text-[0.9375rem] leading-[1.65] text-muted-foreground">
                Мы уже получили ваши документы. Обычно модерация занимает до двух
                рабочих дней.
              </p>
              {documents.length ? (
                <ul className="grid gap-3 mt-5">
                  {documents.map((document) => (
                    <li
                      key={document.documentType}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-[1rem] bg-surface-high/[0.78] border border-glass-border max-md:flex-col max-md:items-stretch"
                    >
                      <span>{document.fileName}</span>
                      <span className={getStatusBadgeClass(document.status)}>
                        {document.status === "submitted" ? "Отправлено" : document.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-sec-pad">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="grid gap-6">
          <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-[clamp(1.25rem,3vw,1.75rem)]">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Верификация</p>
            <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">Подтвердите профиль гида</h1>
            <p className="text-[0.9375rem] leading-[1.65] text-muted-foreground">
              Загрузите обязательные документы. После отправки заявка уйдёт в
              ручную проверку.
            </p>
            {verificationStatus === "rejected" ? (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-[1rem] bg-destructive/10 text-destructive">
                <div>
                  <strong className="block text-foreground">Проверка отклонена.</strong>
                  <span>{verificationNotes ?? "Исправьте документы и отправьте их снова."}</span>
                </div>
              </div>
            ) : null}
          </div>
          <VerificationUploadForm
            initialDocuments={documents}
            actions={{
              getUploadUrl,
              confirmGuideAssetUpload,
              confirmDocumentUpload,
              submitForVerification,
            }}
          />
        </div>
      </div>
    </section>
  );
}
