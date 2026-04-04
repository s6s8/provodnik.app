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
  if (status === "approved") return "upload-status-badge upload-status-badge--success";
  if (status === "submitted") return "upload-status-badge upload-status-badge--pending";
  if (status === "rejected") return "upload-status-badge upload-status-badge--danger";
  return "upload-status-badge";
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
      <section className="section">
        <div className="container">
          <div className="upload-shell">
            <div className="glass-panel upload-status-panel">
              <p className="sec-label">Верификация</p>
              <h1 className="sec-title">Ваш аккаунт верифицирован</h1>
              <div className="upload-status-row">
                <span className={getStatusBadgeClass("approved")}>Подтверждено</span>
              </div>
              <p className="upload-copy">
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
      <section className="section">
        <div className="container">
          <div className="upload-shell">
            <div className="glass-panel upload-status-panel">
              <p className="sec-label">Верификация</p>
              <h1 className="sec-title">Документы на проверке</h1>
              <div className="upload-status-row">
                <span className={getStatusBadgeClass("submitted")}>На проверке</span>
              </div>
              <p className="upload-copy">
                Мы уже получили ваши документы. Обычно модерация занимает до двух
                рабочих дней.
              </p>
              {documents.length ? (
                <ul className="upload-document-list">
                  {documents.map((document) => (
                    <li key={document.documentType} className="upload-document-list__item">
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
    <section className="section">
      <div className="container">
        <div className="upload-shell">
          <div className="glass-panel upload-status-panel">
            <p className="sec-label">Верификация</p>
            <h1 className="sec-title">Подтвердите профиль гида</h1>
            <p className="upload-copy">
              Загрузите обязательные документы. После отправки заявка уйдёт в
              ручную проверку.
            </p>
            {verificationStatus === "rejected" ? (
              <div className="upload-alert upload-alert--danger">
                <div>
                  <strong>Проверка отклонена.</strong>
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
