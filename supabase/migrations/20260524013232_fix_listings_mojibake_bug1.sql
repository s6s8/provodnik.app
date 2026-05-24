-- Fix BUG-1 (ERR-098): restore canonical Russian title/route/description for
-- 2 Moscow listings whose text was corrupted (mojibake) post-seed. Canonical
-- values come from the original seed migration 20260401000002_seed.sql.
-- Already applied via Supabase MCP execute_sql on 2026-05-24; this file is
-- the repo-side trail so a fresh schema reset re-applies the same fix.

UPDATE public.listings SET
  title = 'Москва за один день: бульвары, переулки и тихие дворы',
  route_summary = 'Тверской бульвар -> Патриаршие пруды -> Хитровка -> Ивановская горка',
  description = 'Пеший маршрут по центру Москвы для тех, кто хочет увидеть город без перегруза фактами и очередями. Подходит для первого знакомства со столицей и спокойной прогулки в небольшой группе.'
WHERE slug = 'moscow-boulevards-and-hidden-yards';

UPDATE public.listings SET
  title = 'Москва: скрытая история переулков и тихих дворов',
  route_summary = 'Чистые пруды -> Китай-город -> Хитровка -> Замоскворечье',
  description = 'Авторский маршрут по историческим переулкам Москвы для тех, кто хочет увидеть город за фасадом туристических маршрутов.'
WHERE slug = 'moscow-hidden-history-tour';
