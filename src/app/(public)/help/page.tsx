import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Accordion } from "radix-ui";

import { HelpArticle } from "@/components/help/HelpArticle";
import { HelpSearch } from "@/components/help/HelpSearch";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HelpArticleRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

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

const CATEGORY_ORDER = [
  "for_travelers",
  "booking",
  "payment",
  "for_guides",
  "moderation",
  "account",
];

const FALLBACK_ARTICLES: HelpArticleRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "kak-zabronirovat-ekskursiyu",
    category: "for_travelers",
    title: "Как забронировать экскурсию?",
    body_md:
      "Выберите экскурсию в каталоге, откройте карточку и нажмите кнопку бронирования. Следуйте шагам на экране.\n\nПри необходимости уточните детали у гида в переписке.",
    position: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "kak-otpravit-zayavku-gidu",
    category: "booking",
    title: "Как отправить заявку гиду?",
    body_md:
      "Оформите бронирование через форму на странице объявления. Ваша заявка попадёт к гиду, который сможет её подтвердить или уточнить детали.",
    position: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "kogda-gid-dolzhen-otvetit",
    category: "booking",
    title: "Когда гид должен ответить?",
    body_md:
      "Сроки ответа зависят от загрузки гида и условий конкретного объявления. Если ответа нет дольше ожидаемого, проверьте статус заявки в личном кабинете.",
    position: 3,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "kak-zaregistrirovatsya-kak-gid",
    category: "for_guides",
    title: "Как зарегистрироваться как гид?",
    body_md:
      "Создайте аккаунт и выберите роль гида в профиле. Заполните данные профиля и пройдите проверку согласно требованиям платформы.",
    position: 4,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "kak-sozdat-obyavlenie",
    category: "for_guides",
    title: "Как создать объявление?",
    body_md:
      "В кабинете гида откройте раздел объявлений и нажмите «Создать». Заполните описание, цену, длительность и медиа, затем отправьте на модерацию.",
    position: 5,
  },
];

function normalizeCategory(category: string | null): string {
  return category ?? "account";
}

function orderedCategories(articles: HelpArticleRow[]): string[] {
  const present = new Set(articles.map((a) => normalizeCategory(a.category)));
  const ordered: string[] = [];
  for (const k of CATEGORY_ORDER) {
    if (present.has(k)) ordered.push(k);
  }
  for (const k of present) {
    if (!CATEGORY_ORDER.includes(k)) ordered.push(k);
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
  if (!flags.FEATURE_TRIPSTER_HELP) {
    notFound();
  }

  let articles: HelpArticleRow[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("help_articles")
      .select("id, slug, category, title, body_md, position")
      .order("position", { ascending: true });
    articles = (data ?? []) as HelpArticleRow[];
  } catch {
    articles = [];
  }

  if (articles.length === 0) {
    articles = FALLBACK_ARTICLES;
  }

  const categories = orderedCategories(articles);

  return (
    <section className="pb-20 pt-10">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Центр помощи
        </h1>
        <HelpSearch articles={articles} />
        <div className="space-y-12">
          {categories.map((category) => {
            const inCategory = articlesForCategory(articles, category);
            if (inCategory.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="mb-4 font-serif text-xl font-semibold text-foreground md:text-2xl">
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <Accordion.Root type="single" collapsible className="w-full">
                  {inCategory.map((article) => (
                    <Accordion.Item
                      key={article.id}
                      value={article.id}
                      id={`article-${article.id}`}
                      className="border-b border-border"
                    >
                      <Accordion.Header className="flex">
                        <Accordion.Trigger
                          className={cn(
                            "flex flex-1 items-center justify-between gap-3 py-4 text-left text-sm font-medium text-foreground transition-all",
                            "hover:underline [&[data-state=open]>svg]:rotate-180",
                          )}
                        >
                          {article.title}
                          <ChevronDown
                            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
