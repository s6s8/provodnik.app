-- Seed: направления (города/регионы) для публичного каталога.
-- В текущей схеме нет отдельной таблицы destinations, поэтому используем
-- служебный каталог public.marketplace_events c payload.

insert into public.marketplace_events (
  id,
  scope,
  request_id,
  booking_id,
  dispute_id,
  actor_id,
  event_type,
  summary,
  detail,
  payload,
  created_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    'moderation',
    null,
    null,
    null,
    null,
    'destination_seed',
    'Элиста, Калмыкия',
    'Каталог направления',
    jsonb_build_object(
      'slug', 'elista-kalmykia',
      'name', 'Элиста',
      'region', 'Калмыкия',
      'imageUrl', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80',
      'description', 'Элиста сочетает буддийскую культуру, степные пейзажи и спокойный темп прогулок. Город удобен для маршрутов на 1-2 дня с короткими переездами. Рядом легко собрать программу с этнопарками и обзорными точками.'
    ),
    timezone('utc', now())
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'moderation',
    null,
    null,
    null,
    null,
    'destination_seed',
    'Казань, Татарстан',
    'Каталог направления',
    jsonb_build_object(
      'slug', 'kazan-tatarstan',
      'name', 'Казань',
      'region', 'Татарстан',
      'imageUrl', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80',
      'description', 'Казань подходит для насыщенных городских маршрутов с историей и гастрономией. Центр хорошо адаптирован под небольшие группы и семейные форматы. Маршруты легко комбинируются с вечерними прогулками и локальными кафе.'
    ),
    timezone('utc', now())
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    'moderation',
    null,
    null,
    null,
    null,
    'destination_seed',
    'Санкт-Петербург, Ленобласть',
    'Каталог направления',
    jsonb_build_object(
      'slug', 'saint-petersburg-leningrad-oblast',
      'name', 'Санкт-Петербург',
      'region', 'Ленобласть',
      'imageUrl', 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?auto=format&fit=crop&w=1600&h=1200&q=80',
      'description', 'Санкт-Петербург и Ленобласть позволяют собирать культурные и загородные маршруты в одном запросе. Переезды между точками можно делать короткими и предсказуемыми. Направление подходит для путешествий в любой сезон.'
    ),
    timezone('utc', now())
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    'moderation',
    null,
    null,
    null,
    null,
    'destination_seed',
    'Москва, МО',
    'Каталог направления',
    jsonb_build_object(
      'slug', 'moscow-moscow-oblast',
      'name', 'Москва',
      'region', 'МО',
      'imageUrl', 'https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80',
      'description', 'Москва и Московская область дают широкий выбор городских и выездных форматов. Можно строить как интенсивные короткие экскурсии, так и спокойные маршруты на выходные. Логистика удобна для групп с разным темпом.'
    ),
    timezone('utc', now())
  ),
  (
    '50000000-0000-4000-8000-000000000005',
    'moderation',
    null,
    null,
    null,
    null,
    'destination_seed',
    'Сочи, Краснодарский край',
    'Каталог направления',
    jsonb_build_object(
      'slug', 'sochi-krasnodar-krai',
      'name', 'Сочи',
      'region', 'Краснодарский край',
      'imageUrl', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=1200&q=80',
      'description', 'Сочи сочетает море, горные локации и активные маршруты в пределах одного региона. Направление удобно для комбинированных программ на 2-3 дня. Доступно много вариантов транспорта между точками.'
    ),
    timezone('utc', now())
  ),
  (
    '50000000-0000-4000-8000-000000000006',
    'moderation',
    null,
    null,
    null,
    null,
    'destination_seed',
    'Байкал, Иркутская область',
    'Каталог направления',
    jsonb_build_object(
      'slug', 'baikal-irkutsk-oblast',
      'name', 'Байкал',
      'region', 'Иркутская область',
      'imageUrl', 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80',
      'description', 'Байкал востребован для природных маршрутов и фотопоездок небольшими группами. Программы обычно требуют точного планирования переездов и погодных сценариев. Направление хорошо подходит для конструктора туров с несколькими точками.'
    ),
    timezone('utc', now())
  )
on conflict (id) do update
set
  summary = excluded.summary,
  detail = excluded.detail,
  payload = excluded.payload,
  created_at = excluded.created_at;
