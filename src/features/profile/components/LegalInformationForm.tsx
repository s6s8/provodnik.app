"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { COUNTRIES } from "@/lib/data/countries";
import { updateLegalInformation } from "@/features/profile/actions/updateLegalInformation";

const NONE_VALUE = "__none__";

interface Props {
  initialData: {
    legalStatus: string | null;
    inn: string | null;
    documentCountry: string | null;
    isTourOperator: boolean;
    tourOperatorRegistryNumber: string | null;
  };
}

export function LegalInformationForm({ initialData }: Props) {
  const [legalStatus, setLegalStatus] = useState<string>(
    initialData.legalStatus ?? NONE_VALUE
  );
  const [inn, setInn] = useState<string>(initialData.inn ?? "");
  const [documentCountry, setDocumentCountry] = useState<string>(
    initialData.documentCountry ?? NONE_VALUE
  );
  const [isTourOperator, setIsTourOperator] = useState<boolean>(
    initialData.isTourOperator
  );
  const [tourOperatorRegistryNumber, setTourOperatorRegistryNumber] =
    useState<string>(initialData.tourOperatorRegistryNumber ?? "");

  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await updateLegalInformation({
          legalStatus: legalStatus === NONE_VALUE ? null : (legalStatus || null),
          inn: inn.trim() || null,
          documentCountry: documentCountry === NONE_VALUE ? null : (documentCountry || null),
          isTourOperator,
          tourOperatorRegistryNumber: isTourOperator
            ? tourOperatorRegistryNumber.trim() || null
            : null,
        });
        setSaved(true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Ошибка сохранения");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Legal status */}
        <div className="space-y-2">
          <Label htmlFor="legal-status">Правовой статус</Label>
          <Select value={legalStatus} onValueChange={setLegalStatus}>
            <SelectTrigger id="legal-status">
              <SelectValue placeholder="Не указано" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Не указано</SelectItem>
              <SelectItem value="self_employed">Самозанятый</SelectItem>
              <SelectItem value="individual">ИП</SelectItem>
              <SelectItem value="company">Юридическое лицо</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* INN */}
        <div className="space-y-2">
          <Label htmlFor="inn">ИНН</Label>
          <Input
            id="inn"
            type="text"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
            placeholder="Введите ИНН"
          />
        </div>

        {/* Document country */}
        <div className="space-y-2">
          <Label htmlFor="document-country">Страна документа</Label>
          <Select value={documentCountry} onValueChange={setDocumentCountry}>
            <SelectTrigger id="document-country">
              <SelectValue placeholder="Выберите страну" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Не выбрано</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Tour operator toggle */}
        <div className="flex items-center gap-3">
          <input
            id="is-tour-operator"
            type="checkbox"
            checked={isTourOperator}
            onChange={(e) => setIsTourOperator(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
          />
          <Label htmlFor="is-tour-operator" className="cursor-pointer">
            Туроператор
          </Label>
        </div>

        {/* Tour operator registry number — shown only when isTourOperator */}
        {isTourOperator && (
          <div className="space-y-2">
            <Label htmlFor="registry-number">
              Номер в реестре туроператоров
            </Label>
            <Input
              id="registry-number"
              type="text"
              value={tourOperatorRegistryNumber}
              onChange={(e) => setTourOperatorRegistryNumber(e.target.value)}
              placeholder="Введите номер реестра"
            />
          </div>
        )}
      </div>

      {saved && (
        <Alert className="border-green-500 text-green-700 bg-green-50">
          Сохранено
        </Alert>
      )}
      {errorMsg && (
        <Alert className="border-destructive text-destructive bg-destructive/10">
          {errorMsg}
        </Alert>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
