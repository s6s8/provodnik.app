"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  generateReferralCode,
  redeemReferralCode,
} from "@/features/referrals/actions/referralActions";

const INVITE_BASE = "https://provodnik.app/invite";

export type ReferralCodeProps = {
  code: string | null;
  redemptionCount: number;
};

export function ReferralCode({ code: initialCode, redemptionCount }: ReferralCodeProps) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(initialCode);
  const [redeemInput, setRedeemInput] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const shareUrl = code ? `${INVITE_BASE}/${code}` : "";

  const onGenerate = useCallback(() => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await generateReferralCode();
        setCode(res.code);
        router.refresh();
      } catch (e) {
        setMessage({
          type: "err",
          text: e instanceof Error ? e.message : "Не удалось создать код",
        });
      }
    });
  }, [router]);

  const onCopyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied("code");
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => setMessage({ type: "err", text: "Не удалось скопировать в буфер обмена" }));
  }, [code]);

  const onCopyLink = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied("link");
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => setMessage({ type: "err", text: "Не удалось скопировать в буфер обмена" }));
  }, [shareUrl]);

  const onRedeem = useCallback(() => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await redeemReferralCode(redeemInput);
        if ("error" in res) {
          setMessage({ type: "err", text: res.error ?? "Ошибка при применении кода" });
          return;
        }
        setMessage({ type: "ok", text: "Код применён, бонусы начислены." });
        setRedeemInput("");
        router.refresh();
      } catch (e) {
        setMessage({
          type: "err",
          text: e instanceof Error ? e.message : "Не удалось применить код",
        });
      }
    });
  }, [redeemInput, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Реферальная программа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!code ? (
          <Button type="button" disabled={pending} onClick={onGenerate}>
            Сгенерировать реферальный код
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-code-display">Ваш код</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="referral-code-display"
                  readOnly
                  value={code}
                  className="font-mono text-lg tracking-wider"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCopyCode}
                  className="h-11 shrink-0 gap-1.5"
                >
                  {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied === "code" ? "Скопировано" : "Скопировать"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ссылка для приглашения</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input readOnly value={shareUrl} className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCopyLink}
                  className="h-11 shrink-0 gap-1.5"
                >
                  {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied === "link" ? "Скопировано" : "Скопировать ссылку"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {redemptionCount} человек использовали ваш код
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="referral-redeem-input">Ввести реферальный код</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              id="referral-redeem-input"
              value={redeemInput}
              onChange={(e) => setRedeemInput(e.target.value)}
              placeholder="Код"
              className="font-mono sm:max-w-xs"
              autoComplete="off"
            />
            <Button type="button" disabled={pending} onClick={onRedeem}>
              Применить
            </Button>
          </div>
        </div>

        {message ? (
          <Alert variant={message.type === "err" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
