"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import type { HelpArticleRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

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

export function HelpSearch({ articles }: { articles: HelpArticleRow[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return articles.filter((a) => matchesQuery(a, q));
  }, [articles, query]);

  const goToArticle = (id: string) => {
    setQuery("");
    requestAnimationFrame(() => {
      document.getElementById(`article-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="relative mb-10">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по справке..."
        className="w-full max-w-md"
        aria-autocomplete="list"
        aria-controls="help-search-results"
        aria-expanded={query.trim().length > 0 && results.length > 0}
      />
      {query.trim().length > 0 ? (
        <div
          id="help-search-results"
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-card border border-border bg-popover shadow-card",
            "max-w-md",
          )}
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Ничего не найдено</p>
          ) : (
            <ul className="py-1">
              {results.map((a) => (
                <li key={a.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
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
  );
}
