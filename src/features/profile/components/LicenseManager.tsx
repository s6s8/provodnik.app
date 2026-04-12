"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addLicense, deleteLicense } from "@/features/profile/actions/licenseActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  listings: GuideListingOption[];
};

export function LicenseManager({ licenses, listings }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const [licenseType, setLicenseType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [applyAllListings, setApplyAllListings] = useState(true);
  const [selectedListingIds, setSelectedListingIds] = useState<Set<string>>(() => new Set());

  function resetForm() {
    setLicenseType("");
    setLicenseNumber("");
    setIssuedBy("");
    setValidUntil("");
    setApplyAllListings(true);
    setSelectedListingIds(new Set());
    setFormError(null);
  }

  function toggleListing(id: string) {
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    setFormError(null);
    if (!licenseType.trim() || !licenseNumber.trim() || !issuedBy.trim()) {
      setFormError("Заполните тип, номер и кем выдан.");
      return;
    }
    if (!applyAllListings && selectedListingIds.size === 0) {
      setFormError("Выберите хотя бы одно предложение или включите «ко всем».");
      return;
    }

    const scope = applyAllListings ? "all" : [...selectedListingIds].join(",");

    startTransition(async () => {
      try {
        await addLicense({
          licenseType,
          licenseNumber,
          issuedBy,
          validUntil: validUntil.trim() || null,
          scope,
        });
        setOpen(false);
        resetForm();
        router.refresh();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Ошибка сохранения");
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Удалить эту лицензию?")) return;
    startTransition(async () => {
      try {
        await deleteLicense(id);
        router.refresh();
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Ошибка удаления");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-foreground">Лицензии и документы</h2>
        <Button type="button" onClick={() => setOpen(true)} disabled={pending}>
          Добавить лицензию
        </Button>
      </div>

      {licenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет добавленных лицензий.</p>
      ) : (
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
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Новая лицензия</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="license-type">Тип документа (аттестат, удостоверение, …)</Label>
              <Input
                id="license-type"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                disabled={pending}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-number">Номер документа</Label>
              <Input
                id="license-number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={pending}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issued-by">Кем выдан</Label>
              <Input
                id="issued-by"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                disabled={pending}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-until">Действует до (необязательно)</Label>
              <Input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={pending}
              />
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <input
                id="apply-all"
                type="checkbox"
                className="size-4 rounded border border-border accent-primary"
                checked={applyAllListings}
                disabled={pending}
                onChange={(e) => setApplyAllListings(e.target.checked)}
              />
              <Label htmlFor="apply-all" className="cursor-pointer font-normal">
                Применить ко всем предложениям
              </Label>
            </div>
            {!applyAllListings ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Выберите предложения:</p>
                {listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет активных предложений для привязки.</p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border/80 p-3">
                    {listings.map((l) => (
                      <li key={l.id} className="flex items-start gap-2">
                        <input
                          id={`listing-${l.id}`}
                          type="checkbox"
                          className="mt-1 size-4 rounded border border-border accent-primary"
                          checked={selectedListingIds.has(l.id)}
                          disabled={pending}
                          onChange={() => toggleListing(l.id)}
                        />
                        <Label htmlFor={`listing-${l.id}`} className="cursor-pointer font-normal leading-snug">
                          {l.title}
                        </Label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={pending} onClick={handleSubmit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
