import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { HelpSearch, type HelpCategoryGroup } from "@/components/help/HelpSearch";
import { InfoHero, InfoPageShell } from "@/components/shared/info-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HELP_FALLBACK_ARTICLES } from "@/data/help-articles";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HelpArticleRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Центр помощи",
  description: "Ответы на частые вопросы о бронировании, гидах и аккаунте",
};

const CATEGORY_LABELS: Record<string, string> = {
  for_travelers: "Для путешественников",
  booking: "Бронирование",
  payment: "Оплата и возврат",
  for_guides: "Для гидов",
  moderation: "Модерация объявлений",
  account: "Аккаунт и профиль",
};

const ALL_CATEGORIES = [
  "for_travelers",
  "booking",
  "payment",
  "for_guides",
  "moderation",
  "account",
] as const;

function isCategoryEnabled(category: string): boolean {
  return category !== "payment" || flags.FEATURE_TR_PAYMENT;
}

const CATEGORY_ORDER: string[] = ALL_CATEGORIES.filter(isCategoryEnabled);

function normalizeCategory(category: string | null): string {
  return category ?? "account";
}

function orderedCategories(articles: HelpArticleRow[]): string[] {
  const present = new Set(
    articles.map((a) => normalizeCategory(a.category)).filter(isCategoryEnabled),
  );
  const ordered: string[] = [];
  for (const k of CATEGORY_ORDER) {
    if (present.has(k)) ordered.push(k);
  }
  for (const k of present) {
    if (!CATEGORY_ORDER.includes(k) && isCategoryEnabled(k)) ordered.push(k);
  }
  return ordered;
}

function articlesForCategory(articles: HelpArticleRow[], category: string): HelpArticleRow[] {
  return articles
    .filter((a) => normalizeCategory(a.category) === category)
    .slice()
    .sort((a, b) => a.position - b.position);
}

export default async function HelpPage() {
  let articles: HelpArticleRow[] = [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("help_articles")
    .select("id, slug, category, title, body_md, position")
    .order("position", { ascending: true });
  if (error) throw error;
  articles = (data ?? []) as HelpArticleRow[];

  if (articles.length === 0) {
    articles = HELP_FALLBACK_ARTICLES;
  }

  const enabledArticles = articles.filter((article) =>
    isCategoryEnabled(normalizeCategory(article.category)),
  );
  const groups: HelpCategoryGroup[] = orderedCategories(enabledArticles)
    .map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category] ?? category,
      articles: articlesForCategory(enabledArticles, category),
    }))
    .filter((group) => group.articles.length > 0);

  return (
    <InfoPageShell width="wide">
      <InfoHero
        eyebrow="Поддержка"
        title="Центр помощи"
        subtitle="Ответы на частые вопросы о бронировании, гидах и аккаунте"
      />
      <HelpSearch articles={enabledArticles} groups={groups} />
      <Card className="mt-16 text-center">
        <CardHeader>
          <CardTitle aria-level={2}>Не нашли ответ?</CardTitle>
          <CardDescription>Напишите нам — ответим в течение рабочего дня.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <a href="mailto:support@provodnik.app">
              <Mail aria-hidden />
              Написать в поддержку
            </a>
          </Button>
        </CardContent>
      </Card>
    </InfoPageShell>
  );
}
