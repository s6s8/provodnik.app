"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOwnPhoneAction } from "@/features/guide/actions/updateOwnPhone";

/**
 * Blocking prompt for guides that have no phone on file. Deliberately not
 * dismissable: the guide stays publicly visible, but cannot use the workspace
 * until a reachable phone exists.
 */
export function PhoneRequiredDialog() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Добавьте телефон</DialogTitle>
          <DialogDescription>
            Телефон нужен, чтобы путешественники и поддержка могли с вами связаться.
            Без него кабинет гида недоступен.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await updateOwnPhoneAction(phone);
              if (result.ok) {
                router.refresh();
                return;
              }
              setError(result.error);
            });
          }}
        >
          <Label htmlFor="guide-phone">Телефон</Label>
          <Input
            id="guide-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+7 900 123-45-67"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-2" disabled={pending || phone.trim() === ""}>
            {pending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
