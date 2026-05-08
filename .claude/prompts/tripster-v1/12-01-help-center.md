# Phase 12.1 — Help center

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-1`
**Branch:** `feat/tripster-v1-p12-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_HELP`

**Relevant types:**
```ts
export type HelpArticleRow = {
  id: string;
  slug: string;
  category: string;
  title: string;
  body_md: string;   // Markdown content
  position: number;
};
```

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**shadcn/ui:** Input, Badge, Separator, Accordion, AccordionItem, AccordionTrigger, AccordionContent

## SCOPE

**Create:**
1. `src/app/(public)/help/page.tsx` — server component FAQ page
2. `src/components/help/HelpSearch.tsx` — client-side search within loaded articles
3. `src/components/help/HelpArticle.tsx` — renders markdown body

**DO NOT touch:** Any other components.

## KNOWLEDGE

### Categories (Russian labels):
```ts
const CATEGORY_LABELS: Record<string, string> = {
  for_travelers: "Для путешественников",
  booking: "Бронирование",
  payment: "Оплата и возврат",
  for_guides: "Для гидов",
  moderation: "Модерация объявлений",
  account: "Аккаунт и профиль",
};
```

### Fallback articles (if DB empty):

Show 5 hardcoded FAQ items:
1. "Как забронировать экскурсию?" — category: for_travelers
2. "Как отправить заявку гиду?" — category: booking
3. "Когда гид должен ответить?" — category: booking
4. "Как зарегистрироваться как гид?" — category: for_guides
5. "Как создать объявление?" — category: for_guides

## TASK

### 1. page.tsx (server component)

```tsx
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_HELP) {
  notFound();
}
```

Fetch articles:
```ts
const { data: articles } = await supabase
  .from("help_articles")
  .select("id, slug, category, title, body_md, position")
  .order("position", { ascending: true });
```

If no articles: use hardcoded fallbacks.

Group by category. For each category: show as Accordion section.

Layout:
```
h1: "Центр помощи"
[HelpSearch articles={articles}]
{categories.map(category => (
  <section key={category}>
    <h2>{CATEGORY_LABELS[category]}</h2>
    <Accordion type="single" collapsible>
      {articlesInCategory.map(article => (
        <AccordionItem key={article.id} value={article.id}>
          <AccordionTrigger>{article.title}</AccordionTrigger>
          <AccordionContent>
            <HelpArticle body={article.body_md} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
))}
```

### 2. HelpSearch.tsx (client component)

Props: `{ articles: HelpArticleRow[] }`

- Input with placeholder "Поиск по справке..."
- Filters articles by matching query in title or body_md (case-insensitive)
- Shows matching articles as a dropdown list or inline highlighted results
- Click on result: scroll to article anchor `#article-{article.id}`
- If query empty: hide results

### 3. HelpArticle.tsx

Props: `{ body: string }`

Render markdown as HTML. Use a simple regex-based converter or just render with `dangerouslySetInnerHTML` after sanitization:
```ts
// Simple markdown conversion for basic formatting:
function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}
```

Wrap in `<div className="prose prose-sm max-w-none">`.

## INVESTIGATION RULE

Read before writing:
- `src/lib/flags.ts` — FEATURE_TRIPSTER_HELP flag name
- `src/lib/supabase/types.ts` — confirm HelpArticleRow exists (may need to add it if missing from types.ts)

If `HelpArticleRow` is missing from types.ts, add it.

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 3 files created
- `/help` shows articles grouped by category in accordions
- Client-side search filters articles
- `FEATURE_TRIPSTER_HELP=0` returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(help): help center — accordion FAQ with client-side search`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
