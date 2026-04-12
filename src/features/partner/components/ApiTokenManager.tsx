"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateApiToken } from "@/features/partner/actions/partnerActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ApiTokenManagerProps = {
  hasExistingToken: boolean;
  /** `partner_accounts.created_at` when a row exists; used for “Последний раз сгенерирован”. */
  generatedAt?: string | null;
};

function formatGeneratedAt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ApiTokenManager({
  hasExistingToken,
  generatedAt,
}: ApiTokenManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runGenerate = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const { token } = await generateApiToken();
        setRevealedToken(token);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось сгенерировать токен");
      }
    });
  }, [router]);

  const handleGenerateClick = useCallback(() => {
    if (hasExistingToken) {
      const ok = window.confirm(
        "Новый токен заменит текущий. Старый перестанет работать сразу после генерации. Продолжить?",
      );
      if (!ok) return;
    }
    runGenerate();
  }, [hasExistingToken, runGenerate]);

  const handleCopy = useCallback(async () => {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
    } catch {
      setError("Не удалось скопировать в буфер обмена");
    }
  }, [revealedToken]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">API токен</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingToken ? (
          <p className="text-sm text-muted-foreground">
            Токен настроен.
            {generatedAt ? (
              <>
                {" "}
                Последний раз сгенерирован: {formatGeneratedAt(generatedAt)}
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Токен не настроен</p>
        )}

        <Button
          type="button"
          onClick={handleGenerateClick}
          disabled={pending}
          variant={hasExistingToken ? "secondary" : "default"}
        >
          {hasExistingToken ? "Сгенерировать новый токен" : "Сгенерировать токен"}
        </Button>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {revealedToken ? (
          <>
            <Alert>
              <AlertTitle>Сохраните токен</AlertTitle>
              <AlertDescription>
                Сохраните токен — он показывается только один раз.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="partner-api-token">Секретный токен</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="partner-api-token"
                  readOnly
                  value={revealedToken}
                  className="font-mono text-sm"
                />
                <Button type="button" variant="outline" onClick={handleCopy}>
                  Копировать
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
