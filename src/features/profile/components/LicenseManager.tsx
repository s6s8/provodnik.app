"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteLicense } from "@/features/profile/actions/licenseActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
};

export function LicenseManager({ licenses }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm("Удалить этот документ?")) return;
    startTransition(async () => {
      try {
        await deleteLicense(id);
        router.refresh();
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Ошибка удаления");
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
    <ul className="space-y-4">
      {licenses.map((lic) => (
        <li key={lic.id}>
          <Card className="border-border/80">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
              <div className="space-y-1">
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
                disabled={pending}
                onClick={() => handleDelete(lic.id)}
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
  );
}
