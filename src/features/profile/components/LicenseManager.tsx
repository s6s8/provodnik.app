"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteLicense } from "@/features/profile/actions/licenseActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/shared/confirm-dialog";

export type GuideLicenseView = {
  id: string;
  licenseType: string;
  licenseNumber: string;
  issuedBy: string;
  validUntil: string | null;
  scopeMode: "all" | "selected";
  listingTitles: string[];
};

export type GuideListingOption = {
  id: string;
  title: string;
};

type Props = {
  licenses: GuideLicenseView[];
  isLocked?: boolean;
};

export function LicenseManager({ licenses, isLocked = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Удалить лицензию?",
      description: "Это действие нельзя отменить.",
      confirmText: "Удалить",
      destructive: true,
    });
    if (!ok) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteLicense(id);
        router.refresh();
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Ошибка при удалении");
      }
    });
  }

  if (licenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Пока нет добавленных документов о квалификации.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteError ? (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      ) : null}
      <ul className="flex flex-col gap-4">
        {licenses.map((lic) => (
        <li key={lic.id}>
          <Card className="border-border/80">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base font-semibold">{lic.licenseType}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  № {lic.licenseNumber} · {lic.issuedBy}
                </p>
                {lic.validUntil ? (
                  <p className="text-xs text-muted-foreground">Действует до {lic.validUntil}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending || isLocked}
                onClick={() => {
                  void handleDelete(lic.id);
                }}
              >
                Удалить
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Область:</span>
                {lic.scopeMode === "all" ? (
                  <Badge variant="secondary">Все предложения</Badge>
                ) : lic.listingTitles.length > 0 ? (
                  lic.listingTitles.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Выбранные предложения</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </li>
        ))}
      </ul>
      {ConfirmDialog}
    </div>
  );
}
