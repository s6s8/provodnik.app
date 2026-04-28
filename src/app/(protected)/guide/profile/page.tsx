import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuideAboutForm } from "@/app/(protected)/profile/guide/about/guide-about-form";
import { LegalInformationForm } from "@/features/profile/components/LegalInformationForm";
import {
  LicenseManager,
  type GuideLicenseView,
  type GuideListingOption,
} from "@/features/profile/components/LicenseManager";
import { VerificationUploadForm } from "@/features/guide/components/verification/verification-upload-form";
import type { UploadedGuideDocument } from "@/features/guide/components/verification/verification-types";
import {
  confirmDocumentUpload,
  confirmGuideAssetUpload,
  getUploadUrl,
  submitForVerification,
} from "@/app/(protected)/guide/verification/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import type { GuideProfileRow, GuideVerificationStatusDb, ListingStatusDb } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Профиль",
};

const SCOPABLE_LISTING_STATUSES: ListingStatusDb[] = [
  "draft",
  "published",
  "paused",
  "pending_review",
  "active",
];

type GuideVerificationDocumentRow = {
  id: string;
  document_type: UploadedGuideDocument["documentType"];
  status: GuideVerificationStatusDb;
  storage_assets:
    | { id: string; object_path: string }
    | Array<{ id: string; object_path: string }>;
};

function getStorageAsset(relation: GuideVerificationDocumentRow["storage_assets"]) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function getStatusBadgeClass(status: GuideVerificationStatusDb) {
  return cn(
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
    status === "approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    status === "submitted" && "bg-primary/10 text-primary",
    status === "rejected" && "bg-destructive/10 text-destructive",
    status === "draft" && "bg-muted text-muted-foreground",
  );
}

function verificationStatusLabel(status: GuideVerificationStatusDb): string {
  switch (status) {
    case "approved": return "Подтверждено";
    case "submitted": return "На проверке";
    case "rejected": return "Отклонено";
    default: return "Не подтверждено";
  }
}

export default async function GuideProfilePage() {
  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated || !auth.userId) {
    redirect("/auth?next=/guide/profile");
  }
  const guideId = auth.userId;

  let profile: Partial<GuideProfileRow> | null = null;
  let verificationStatus: GuideVerificationStatusDb = "draft";
  let verificationNotes: string | null = null;
  let listings: GuideListingOption[] = [];
  let licenses: GuideLicenseView[] = [];
  let documents: UploadedGuideDocument[] = [];
  let legalInitialData = {
    legalStatus: null as string | null,
    inn: null as string | null,
    documentCountry: null as string | null,
    isTourOperator: false,
    tourOperatorRegistryNumber: null as string | null,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const [profileRes, licenseRes, listingRes, documentRes] = await Promise.all([
      supabase
        .from("guide_profiles")
        .select(
          "bio, languages, years_experience, regions, legal_status, inn, document_country, is_tour_operator, tour_operator_registry_number, verification_status, verification_notes",
        )
        .eq("user_id", guideId)
        .maybeSingle(),
      supabase
        .from("guide_licenses")
        .select("id, license_type, license_number, issued_by, valid_until, scope_mode")
        .eq("guide_id", guideId)
        .order("created_at", { ascending: false }),
      supabase
        .from("listings")
        .select("id, title")
        .eq("guide_id", guideId)
        .in("status", SCOPABLE_LISTING_STATUSES)
        .order("title", { ascending: true }),
      supabase
        .from("guide_documents")
        .select("id, document_type, status, storage_assets!inner(id, object_path)")
        .eq("guide_id", guideId)
        .order("created_at", { ascending: false }),
    ]);

    profile = profileRes.data;
    verificationStatus = (profile?.verification_status ?? "draft") as GuideVerificationStatusDb;
    verificationNotes = profile?.verification_notes ?? null;

    listings =
      listingRes.data?.map((l) => ({ id: l.id, title: l.title })) ?? [];

    const licenseIds = (licenseRes.data ?? []).map((r) => r.id);
    const titleById = new Map(listings.map((l) => [l.id, l.title] as const));

    let links: { license_id: string; listing_id: string }[] = [];
    if (licenseIds.length > 0) {
      const { data: linkRows } = await supabase
        .from("listing_licenses")
        .select("license_id, listing_id")
        .in("license_id", licenseIds);
      links = linkRows ?? [];
    }

    const titlesByLicense = new Map<string, string[]>();
    for (const row of links) {
      const title = titleById.get(row.listing_id);
      if (!title) continue;
      const arr = titlesByLicense.get(row.license_id) ?? [];
      arr.push(title);
      titlesByLicense.set(row.license_id, arr);
    }

    licenses =
      (licenseRes.data ?? []).map((row) => ({
        id: row.id,
        licenseType: row.license_type,
        licenseNumber: row.license_number,
        issuedBy: row.issued_by,
        validUntil: row.valid_until,
        scopeMode: row.scope_mode === "all" ? "all" : "selected",
        listingTitles: titlesByLicense.get(row.id) ?? [],
      }));

    documents = (
      (documentRes.data ?? []) as GuideVerificationDocumentRow[]
    )
      .map((row) => {
        const asset = getStorageAsset(row.storage_assets);
        if (!asset) return null;
        return {
          assetId: asset.id,
          documentType: row.document_type,
          objectPath: asset.object_path,
          fileName: asset.object_path.split("/").at(-1) ?? asset.object_path,
          status: row.status,
        };
      })
      .filter((item): item is UploadedGuideDocument => Boolean(item));

    legalInitialData = {
      legalStatus: profile?.legal_status ?? null,
      inn: profile?.inn ?? null,
      documentCountry: profile?.document_country ?? null,
      isTourOperator: profile?.is_tour_operator ?? false,
      tourOperatorRegistryNumber: profile?.tour_operator_registry_number ?? null,
    };
  } catch (err) {
    console.error("[GuideProfilePage] data fetch failed:", err);
  }

  return (
    <div className="space-y-10">
      <section id="about">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">О себе</CardTitle>
            <p className="text-sm text-muted-foreground">
              Эта информация отображается на вашей публичной странице.
            </p>
          </CardHeader>
          <CardContent>
            <GuideAboutForm
              initialBio={profile?.bio ?? ""}
              initialLanguages={profile?.languages ?? []}
              initialYearsExperience={profile?.years_experience ?? null}
            />
          </CardContent>
        </Card>
      </section>

      <section id="legal">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Юридические данные</CardTitle>
            <p className="text-sm text-muted-foreground">
              ИНН, статус, страна документа.
            </p>
          </CardHeader>
          <CardContent>
            <LegalInformationForm initialData={legalInitialData} />
          </CardContent>
        </Card>
      </section>

      <section id="license">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Лицензии</CardTitle>
            <p className="text-sm text-muted-foreground">
              Документы и к каким экскурсиям они относятся.
            </p>
          </CardHeader>
          <CardContent>
            <LicenseManager licenses={licenses} listings={listings} />
          </CardContent>
        </Card>
      </section>

      <section id="verification">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Верификация</CardTitle>
              <span className={getStatusBadgeClass(verificationStatus)}>
                {verificationStatusLabel(verificationStatus)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Загрузите обязательные документы для проверки аккаунта.
            </p>
          </CardHeader>
          <CardContent>
            {verificationStatus === "approved" ? (
              <p className="text-sm text-muted-foreground">
                Профиль прошёл проверку. Путешественники видят, что вы подтвердили документы.
              </p>
            ) : verificationStatus === "submitted" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Документы отправлены. Проверка обычно занимает 1–2 рабочих дня.
                </p>
                {documents.length > 0 ? (
                  <ul className="space-y-2">
                    {documents.map((doc) => (
                      <li
                        key={doc.documentType}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-4 py-3"
                      >
                        <span className="text-sm">{doc.fileName}</span>
                        <span className={getStatusBadgeClass(doc.status)}>
                          {doc.status === "submitted" ? "Отправлено" : doc.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {verificationStatus === "rejected" ? (
                  <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <strong className="block text-foreground">Проверка отклонена.</strong>
                    {verificationNotes ?? "Исправьте документы и отправьте их снова."}
                  </div>
                ) : null}
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
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
