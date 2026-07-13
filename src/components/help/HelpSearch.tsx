"use client";

import { Accordion } from "radix-ui";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { HelpArticle } from "@/components/help/HelpArticle";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import type { HelpArticleRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type HelpCategoryGroup = {
  id: string;
  label: string;
  articles: HelpArticleRow[];
};

function matchesQuery(article: HelpArticleRow, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return false;
  return (
    article.title.toLowerCase().includes(n) || article.body_md.toLowerCase().includes(n)
  );
}

function highlightText(text: string, q: string): ReactNode {
  const n = q.trim().toLowerCase();
  if (!n) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(n);
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + n.length);
  const after = text.slice(idx + n.length);
  return (
    <>
      {before}
      <mark className="rounded-sm bg-accent/40 px-0.5">{match}</mark>
      {after}
    </>
  );
}

/**
 * Search box + the category accordions. The open accordion id lives here in
 * state so picking a search result can open that article, not just scroll to it.
 */
export function HelpSearch({
  articles,
  groups,
}: {
  articles: HelpArticleRow[];
  groups: HelpCategoryGroup[];
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string>("");

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return articles.filter((a) => matchesQuery(a, q));
  }, [articles, query]);

  const goToArticle = (id: string) => {
    setQuery("");
    setOpenId(id);
    requestAnimationFrame(() => {
      document.getElementById(`article-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <>
      <div className="relative mb-10">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по справке..."
            aria-label="Поиск по справке"
            className="w-full pl-9"
          />
        </div>
        {query.trim().length > 0 ? (
          <div
            id="help-search-results"
            className={cn(
              "absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-card border border-border bg-popover shadow-card",
              "max-w-md",
            )}
          >
            {results.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Search className="size-5" />}
                  title="Ничего не найдено"
                  description="Попробуйте другой запрос или напишите нам на support@provodnik.app"
                />
              </div>
            ) : (
              <ul className="py-1">
                {results.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      onClick={() => goToArticle(a.id)}
                    >
                      {highlightText(a.title, query)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-12">
        {groups.map((group) => (
          <section key={group.id}>
            <h2 className="mb-4 text-section font-extrabold tracking-tight text-foreground">
              {group.label}
            </h2>
            <Accordion.Root
              type="single"
              collapsible
              value={openId}
              onValueChange={setOpenId}
              className="w-full"
            >
              {group.articles.map((article) => (
                <Accordion.Item
                  key={article.id}
                  value={article.id}
                  id={`article-${article.id}`}
                  className="border-b border-border scroll-mt-nav-h"
                >
                  <Accordion.Header className="flex">
                    <Accordion.Trigger
                      className={cn(
                        "flex min-h-11 flex-1 items-center justify-between gap-3 rounded-md py-4 text-left text-base font-medium text-foreground transition-all",
                        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
                        "hover:text-primary [&[data-state=open]>svg]:rotate-180",
                      )}
                    >
                      {article.title}
                      <ChevronDown
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
                        aria-hidden
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden text-sm">
                    <div className="pb-4 pt-0">
                      <HelpArticle body={article.body_md} />
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </section>
        ))}
      </div>
    </>
  );
}
