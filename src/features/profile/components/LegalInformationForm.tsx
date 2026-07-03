"use client";

import { useState, useTransition } from "react";

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
import { COUNTRIES } from "@/data/countries";
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
  isLocked?: boolean;
}

export function LegalInformationForm({ initialData, isLocked = false }: Props) {
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
    if (isLocked) return;
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
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {isLocked && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Профиль одобрен. Юридические данные недоступны для редактирования — для изменений напишите администраторам.
        </p>
      )}
      <fieldset disabled={isLocked} className="space-y-5 border-0 p-0 m-0">
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

        {/* Tour operator toggle — explicit, tappable row with helper text */}
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <label
            htmlFor="is-tour-operator"
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              id="is-tour-operator"
              type="checkbox"
              checked={isTourOperator}
              onChange={(e) => setIsTourOperator(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                Я зарегистрирован как туроператор
              </span>
              <span className="block text-xs text-muted-foreground">
                Отметьте, если у вас есть запись в реестре туроператоров.
              </span>
            </span>
          </label>

          {/* Registry number — shown only when isTourOperator */}
          {isTourOperator && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="registry-number">
                Номер в реестре туроператоров
              </Label>
              <Input
                id="registry-number"
                type="text"
                value={tourOperatorRegistryNumber}
                onChange={(e) => setTourOperatorRegistryNumber(e.target.value)}
                placeholder="Например: РТО 000000"
              />
            </div>
          )}
        </div>
      </fieldset>

      {/* Save footer — clearly separated from the form fields */}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center">
        {!isLocked && (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Сохранение…" : "Сохранить"}
          </Button>
        )}
        {saved && <p className="text-sm text-success">Сохранено</p>}
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      </div>
    </form>
  );
}
