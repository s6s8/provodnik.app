"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  markOnboardingComplete,
  saveOnboardingStep,
} from "@/features/guide/actions/completeOnboarding";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const ACTIVITY_OPTIONS = [
  { value: "excursions", label: "Я провожу экскурсии" },
  { value: "tours", label: "Я организую туры" },
  { value: "transfers", label: "Предлагаю трансферы" },
  { value: "all", label: "Всё перечисленное" },
] as const;

type OnboardingWizardProps = {
  initialStep?: number;
};

export function OnboardingWizard({
  initialStep = 1,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [activityType, setActivityType] = useState<string>("");
  const [region, setRegion] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const progressValue = (step / 5) * 100;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Шаг {step} из 5
          </span>
          <Badge variant="outline" className="shrink-0">
            {step}/5
          </Badge>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
      <Separator />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Добро пожаловать в Проводник!</CardTitle>
              <CardDescription>
                Расскажите немного о себе, чтобы мы могли настроить ваш профиль
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
              <Button type="button" onClick={() => setStep(2)}>
                Начать
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CardHeader>
              <CardTitle>Тип деятельности</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <RadioGroup
                value={activityType}
                onValueChange={setActivityType}
                className="gap-3"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center gap-3 rounded-[1.2rem] border border-border/60 bg-background/40 px-3 py-2"
                  >
                    <RadioGroupItem value={opt.value} id={`act-${opt.value}`} />
                    <Label
                      htmlFor={`act-${opt.value}`}
                      className="cursor-pointer font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
              <Button
                type="button"
                disabled={!activityType || isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      await saveOnboardingStep(2, {
                        activity_type: activityType,
                      });
                      setStep(3);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Не удалось сохранить",
                      );
                    }
                  });
                }}
              >
                Далее
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <CardHeader>
              <CardTitle>Регион</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="onboarding-region">
                  Ваш основной регион деятельности
                </Label>
                <Input
                  id="onboarding-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Например, Краснодарский край"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="onboarding-about">
                  Расскажите о себе (необязательно)
                </Label>
                <Textarea
                  id="onboarding-about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Кратко о вашем опыте и формате работы"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
              <Button
                type="button"
                disabled={!region.trim() || isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      await saveOnboardingStep(3, {
                        region: region.trim(),
                        about: about.trim() || undefined,
                      });
                      setStep(4);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Не удалось сохранить",
                      );
                    }
                  });
                }}
              >
                Далее
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <CardHeader>
              <CardTitle>Первое объявление</CardTitle>
              <CardDescription>
                Готовы создать первое объявление?
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-wrap justify-end gap-2 border-t-0 bg-transparent pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(5)}
              >
                Позже
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/guide/listings/new")}
              >
                Создать сейчас
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <CardHeader>
              <CardTitle>Профиль настроен!</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="h-2" />
            </CardContent>
            <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      await markOnboardingComplete();
                      router.push("/guide");
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Не удалось завершить",
                      );
                    }
                  });
                }}
              >
                Перейти к кабинету
              </Button>
            </CardFooter>
          </>
        ) : null}
      </Card>
    </div>
  );
}
