"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { updatePersonalSettings } from "@/features/profile/actions/updatePersonalSettings";
import { NotificationPrefsMatrix } from "@/features/profile/components/NotificationPrefsMatrix";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const personalSettingsSchema = z.object({
  locale: z.enum(["ru", "en"]),
  preferredCurrency: z.enum(["RUB", "USD", "EUR"]),
  notificationPrefs: z.record(z.string(), z.unknown()),
});

type PersonalSettingsValues = z.infer<typeof personalSettingsSchema>;

export type PersonalSettingsFormProps = {
  initialLocale: string;
  initialCurrency: string;
  initialNotificationPrefs: Record<string, unknown>;
};

export function PersonalSettingsForm({
  initialLocale,
  initialCurrency,
  initialNotificationPrefs,
}: PersonalSettingsFormProps) {
  const [success, setSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PersonalSettingsValues>({
    resolver: zodResolver(personalSettingsSchema),
    defaultValues: {
      locale: initialLocale as PersonalSettingsValues["locale"],
      preferredCurrency:
        initialCurrency as PersonalSettingsValues["preferredCurrency"],
      notificationPrefs: { ...initialNotificationPrefs },
    },
    mode: "onTouched",
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const notificationPrefs = watch("notificationPrefs");
  const isLoading = isSubmitting || isPending;

  const onSubmit = React.useCallback(
    (values: PersonalSettingsValues) => {
      setSuccess(false);
      setSubmitError(null);

      startTransition(async () => {
        try {
          await updatePersonalSettings({
            locale: values.locale,
            preferredCurrency: values.preferredCurrency,
            notificationPrefs: values.notificationPrefs,
          });
          setSuccess(true);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Не удалось сохранить настройки";
          setSubmitError(message);
        }
      });
    },
    [],
  );

  return (
    <Card className="max-w-3xl">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-display text-xl text-foreground">
          Личные настройки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {success ? (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle2 className="text-success" aria-hidden />
            <AlertTitle>Сохранено</AlertTitle>
            <AlertDescription>
              Настройки профиля и уведомлений обновлены.
            </AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="personal-locale">Язык интерфейса</Label>
              <Controller
                name="locale"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="personal-locale"
                      className="w-full max-w-xs"
                      aria-invalid={!!errors.locale}
                    >
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.locale ? (
                <p className="text-sm text-destructive">{errors.locale.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="personal-currency">Валюта по умолчанию</Label>
              <Controller
                name="preferredCurrency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="personal-currency"
                      className="w-full max-w-xs"
                      aria-invalid={!!errors.preferredCurrency}
                    >
                      <SelectValue placeholder="Выберите валюту" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">₽ Рубль</SelectItem>
                      <SelectItem value="USD">$ Доллар</SelectItem>
                      <SelectItem value="EUR">€ Евро</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.preferredCurrency ? (
                <p className="text-sm text-destructive">
                  {errors.preferredCurrency.message}
                </p>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Уведомления
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Включите или отключите каналы для каждого типа события.
              </p>
            </div>
            <NotificationPrefsMatrix
              prefs={notificationPrefs}
              onChange={(next) =>
                setValue("notificationPrefs", next, { shouldDirty: true })
              }
            />
            {errors.notificationPrefs ? (
              <p className="text-sm text-destructive">
                {errors.notificationPrefs.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Сохранение…" : "Сохранить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
