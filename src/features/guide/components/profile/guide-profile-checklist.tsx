"use client";

import { CircleCheck, Circle, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type {
  ChecklistStep,
  ChecklistStepStatus,
  GuideProfileChecklistProps,
} from "./guide-profile-checklist-types";

function scrollToAnchor(anchor: string) {
  document
    .getElementById(anchor)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const STATUS_META: Record<
  ChecklistStepStatus,
  {
    label: string;
    badgeVariant: "default" | "outline" | "secondary";
    Icon: typeof CircleCheck;
    iconClass: string;
  }
> = {
  done: {
    label: "Готово",
    badgeVariant: "default",
    Icon: CircleCheck,
    iconClass: "text-success",
  },
  todo: {
    label: "Нужно заполнить",
    badgeVariant: "outline",
    Icon: Circle,
    iconClass: "text-muted-foreground",
  },
  locked: {
    label: "Заблокировано",
    badgeVariant: "secondary",
    Icon: Lock,
    iconClass: "text-muted-foreground",
  },
};

function ChecklistRow({ step }: { step: ChecklistStep }) {
  const meta = STATUS_META[step.status];
  const { Icon } = meta;
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-4 py-3">
      <span className="flex items-center gap-2.5">
        <Icon className={cn("size-5 shrink-0", meta.iconClass)} aria-hidden />
        <span className="text-sm font-medium text-foreground">{step.label}</span>
      </span>
      <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
    </li>
  );
}

export function GuideProfileChecklist({
  steps,
  firstIncompleteStep,
  verificationStatus,
}: GuideProfileChecklistProps) {
  const isApproved = verificationStatus === "approved";
  const isSubmitted = verificationStatus === "submitted";
  const showStatusBadge = isApproved || isSubmitted;

  const showFillCta =
    !showStatusBadge &&
    firstIncompleteStep !== null &&
    firstIncompleteStep.id !== "verification";
  const showSubmitCta = !showStatusBadge && !showFillCta;

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="text-xl">Готовность профиля</CardTitle>
        <CardDescription>
          Заполните шаги ниже, чтобы отправить профиль на проверку.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-2.5">
          {steps.map((step) => (
            <ChecklistRow key={step.id} step={step} />
          ))}
        </ul>

        {showStatusBadge ? (
          <Badge
            variant={isApproved ? "default" : "secondary"}
            className="gap-1.5"
          >
            <ShieldCheck className="size-3.5" aria-hidden />
            {isApproved ? "Профиль подтверждён" : "Отправлено на проверку"}
          </Badge>
        ) : showFillCta && firstIncompleteStep ? (
          <Button
            type="button"
            onClick={() => scrollToAnchor(firstIncompleteStep.anchor)}
          >
            Заполнить
          </Button>
        ) : showSubmitCta ? (
          <Button type="button" onClick={() => scrollToAnchor("verification")}>
            Подать на верификацию
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
