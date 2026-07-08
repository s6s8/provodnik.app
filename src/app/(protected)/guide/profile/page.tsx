import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GUIDE_TYPES } from "@/features/auth/guide-type";
import { GuideAboutForm } from "@/features/guide/components/profile/guide-about-form";
import { GuideAvailabilityToggle } from "@/features/guide/components/profile/guide-availability-toggle";
import { GuideProfileChecklist } from "@/features/guide/components/profile/guide-profile-checklist";
import type { ChecklistStep } from "@/features/guide/components/profile/guide-profile-checklist-types";
import { LegalInformationForm } from "@/features/profile/components/LegalInformationForm";
import {
  LicenseManager,
  type GuideLicenseView,
  type GuideListingOption,
} from "@/features/profile/components/LicenseManager";
import { LicenseAddButton } from "@/features/profile/components/LicenseAddButton";
import { VerificationUploadForm } from "@/features/guide/components/verification/verification-upload-form";
import { GuideProfileSectionBoundary } from "@/features/guide/components/verification/guide-profile-section-boundary";
import type { UploadedGuideDocument } from "@/features/guide/components/verification/verification-types";
import {
  confirmDocumentUpload,
  confirmGuideAssetUpload,
  getUploadUrl,
  submitForVerification,
} from "@/features/guide/verification-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHasAccess } from "@/lib/auth/role-routing";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { isGuideProfileConfirmed } from "@/lib/profile/guide-verification";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import type { GuideProfileRow, GuideVerificationStatusDb, ListingStatusDb } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { AvatarUploadBlock } from "@/app/(protected)/profile/_components/avatar-upload-block";

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
    status === "approved" && "bg-success/10 text-success",
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

function documentStatusLabel(status: GuideVerificationStatusDb): string {
  switch (status) {
    case "approved": return "Подтверждён";
    case "submitted": return "Отправлен";
    case "rejected": return "Отклонён";
    default: return "Не отправлен";
  }
}

export default async function GuideProfilePage() {
  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated || !auth.userId) {
    redirect("/auth?next=/guide/profile");
  }
  if (!auth.role || !roleHasAccess(auth.role, "guide")) {
    redirect(
      auth.canonicalRedirectTo ?? auth.missingRoleRecoveryTo ?? "/auth?next=/guide/profile",
    );
  }
  const guideId = auth.userId;

  let avatarUrl: string | null = null;
  let displayName: string = resolveDisplayName("guide", { full_name: auth.email ?? null });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", guideId)
      .maybeSingle();
    if (profileRow) {
      avatarUrl = (profileRow as { avatar_url?: string | null }).avatar_url ?? null;
      const fullName = (profileRow as { full_name?: string | null }).full_name;
      displayName = resolveDisplayName("guide", { full_name: fullName ?? auth.email ?? null });
    }
  } catch {
    // fall back to defaults
  }


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
    const { data: verificationRow } = await supabase
      .from("guide_profiles")
      .select("verification_status")
      .eq("user_id", guideId)
      .maybeSingle();
    if (verificationRow?.verification_status) {
      verificationStatus = verificationRow.verification_status as GuideVerificationStatusDb;
    }
  } catch (err) {
    console.error("[GuideProfilePage] verification status fetch failed:", err);
  }

  const isVerifiedDataLocked = isGuideProfileConfirmed(verificationStatus);

  try {
    const supabase = await createSupabaseServerClient();
    const [profileRes, licenseRes, listingRes, documentRes] = await Promise.all([
      supabase
        .from("guide_profiles")
        .select(
          "bio, base_city, languages, specializations, years_experience, regions, legal_status, inn, document_country, is_tour_operator, tour_operator_registry_number, verification_status, verification_notes, guide_type, is_available",
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
    if (profile?.verification_status) {
      verificationStatus = profile.verification_status as GuideVerificationStatusDb;
    }
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

  const avatarDone = avatarUrl != null;
  const aboutDone = (profile?.bio ?? "").trim().length > 0;
  const legalDone = Boolean(
    legalInitialData.legalStatus &&
      legalInitialData.inn &&
      legalInitialData.documentCountry,
  );
  const licenseDone = licenses.length > 0;
  const verificationDone = verificationStatus !== "draft";
  const isAnketaComplete = aboutDone && legalDone && licenseDone;

  const lockedStatus: ChecklistStep["status"] = isVerifiedDataLocked
    ? "locked"
    : "todo";

  const steps: ChecklistStep[] = [
    {
      id: "avatar",
      label: "Аватар",
      anchor: "avatar",
      status: avatarDone ? "done" : "todo",
    },
    {
      id: "about",
      label: "О себе",
      anchor: "about",
      status: aboutDone ? "done" : lockedStatus,
    },
    {
      id: "legal",
      label: "Юр. данные",
      anchor: "legal",
      status: legalDone ? "done" : lockedStatus,
    },
    {
      id: "license",
      label: "Лицензия",
      anchor: "license",
      status: licenseDone ? "done" : lockedStatus,
    },
    {
      id: "verification",
      label: "Верификация",
      anchor: "verification",
      status: verificationDone ? "done" : "todo",
    },
  ];
  const firstIncompleteStep = steps.find((step) => step.status !== "done") ?? null;
  const guideTypeLabel =
    GUIDE_TYPES.find((t) => t.id === profile?.guide_type)?.label ?? null;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Профиль гида</h1>
        <p className="text-sm text-muted-foreground">
          Заполните разделы ниже — мы подскажем следующий шаг.
        </p>
        {guideTypeLabel && (
          <p className="text-sm text-muted-foreground">
            Тип: <span className="font-medium text-foreground">{guideTypeLabel}</span>
          </p>
        )}
      </header>

      <GuideProfileChecklist
        steps={steps}
        firstIncompleteStep={firstIncompleteStep}
        verificationStatus={verificationStatus}
      />

      {verificationStatus === "approved" ? (
        <GuideAvailabilityToggle available={profile?.is_available ?? false} />
      ) : null}

      <GuideProfileSectionBoundary id="avatar" title="Фото">
        {() => <AvatarUploadBlock avatarUrl={avatarUrl} displayName={displayName} />}
      </GuideProfileSectionBoundary>

      <GuideProfileSectionBoundary id="about" title="О себе">
        {() => (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">О себе</CardTitle>
            </CardHeader>
            <CardContent>
              <GuideAboutForm
                initialBio={profile?.bio ?? ""}
                initialBaseCity={profile?.base_city ?? ""}
                initialLanguages={profile?.languages ?? []}
                initialSpecializations={profile?.specializations ?? []}
                initialYearsExperience={profile?.years_experience ?? null}
                initialRegions={profile?.regions ?? []}
                isLocked={isVerifiedDataLocked}
              />
            </CardContent>
          </Card>
        )}
      </GuideProfileSectionBoundary>

      <GuideProfileSectionBoundary id="legal" title="Юридические данные">
        {() => (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Юридические данные</CardTitle>
              <p className="text-sm text-muted-foreground">
                Нужны для проверки статуса гида и допуска к заявкам. После
                одобрения профиля изменить их можно через администратора.
              </p>
            </CardHeader>
            <CardContent>
              <LegalInformationForm initialData={legalInitialData} isLocked={isVerifiedDataLocked} />
            </CardContent>
          </Card>
        )}
      </GuideProfileSectionBoundary>

      <GuideProfileSectionBoundary id="license" title="Документ о квалификации">
        {() => (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Документ о квалификации</CardTitle>
              <CardDescription>
                Укажите документ и к каким видам экскурсиям он относится.
              </CardDescription>
              <LicenseAddButton listings={listings} isLocked={isVerifiedDataLocked} />
            </CardHeader>
            <CardContent className="space-y-4">
              {isVerifiedDataLocked ? (
                <p className="text-sm text-muted-foreground">
                  Профиль одобрен. Документы о квалификации недоступны для редактирования из обычного профиля.
                </p>
              ) : null}
              <LicenseManager licenses={licenses} isLocked={isVerifiedDataLocked} />
            </CardContent>
          </Card>
        )}
      </GuideProfileSectionBoundary>

      <GuideProfileSectionBoundary id="verification" title="Верификация">
        {() => (
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
                            {documentStatusLabel(doc.status)}
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
                    isAnketaComplete={isAnketaComplete}
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
        )}
      </GuideProfileSectionBoundary>
    </div>
  );
}
