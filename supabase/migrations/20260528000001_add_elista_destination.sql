insert into public.destinations
  (slug, name, region, category, description, hero_image_url, listing_count, guides_count, rating)
values
  ('elista',
   'Элиста',
   'Калмыкия',
   'culture',
   'Элиста — буддийская столица России и точка входа в калмыцкую степь. Город удобен для коротких маршрутов: хурул «Золотая обитель Будды Шакьямуни», шахматный городок Сити-Чесс, степные выезды и знакомство с калмыцкой кухней складываются в плотную программу даже на пару дней.',
   'https://images.unsplash.com/photo-1657293493705-557ab000afe1?auto=format&fit=crop&w=1600&h=1200&q=80',
   0,
   0,
   4.8)
on conflict (slug) do update set
  name = excluded.name,
  region = excluded.region,
  category = excluded.category,
  description = excluded.description,
  hero_image_url = excluded.hero_image_url,
  updated_at = now();
