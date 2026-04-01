"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingForm } from "./listing-form";
import type { ListingInput } from "@/lib/supabase/listing-schema";

type GuideListingCreateScreenProps = {
  onSubmit: (data: ListingInput) => Promise<string>;
};

export function GuideListingCreateScreen({
  onSubmit,
}: GuideListingCreateScreenProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/guide/listings">
          <ChevronLeft className="size-4" />
          Мои туры
        </Link>
      </Button>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Кабинет гида
        </p>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Новый тур
        </h1>
        <p className="text-sm text-muted-foreground">
          Заполните основные данные. После создания вы сможете добавить фото и отправить тур на проверку.
        </p>
      </div>

      <Card className="max-w-2xl border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Данные тура</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingForm onSubmit={onSubmit} submitLabel="Создать тур" />
        </CardContent>
      </Card>
    </div>
  );
}
