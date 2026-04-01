"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingForm } from "./listing-form";
import type { ListingInput } from "@/lib/supabase/listings";

type GuideListingEditScreenProps = {
  listingId: string;
  defaultValues: Partial<ListingInput>;
  onSubmit: (data: ListingInput) => Promise<string>;
};

export function GuideListingEditScreen({
  listingId,
  defaultValues,
  onSubmit,
}: GuideListingEditScreenProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/guide/listings">
            <ChevronLeft className="size-4" />
            Мои туры
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/guide/listings/${listingId}`}>Просмотр</Link>
        </Button>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Кабинет гида
        </p>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Редактировать тур
        </h1>
      </div>

      <Card className="max-w-2xl border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Данные тура</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            submitLabel="Сохранить изменения"
          />
        </CardContent>
      </Card>
    </div>
  );
}
