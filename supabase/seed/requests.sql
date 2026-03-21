-- Seed: открытые запросы (>=8) с регионом, imageUrl, сценариями цены и диапазонами дат.
-- Дополнительные поля сохранены в notes (JSON-текст) для совместимости текущей схемы.

insert into public.profiles (id, role, email, full_name, avatar_url)
values
  ('10000000-0000-4000-8000-000000000201', 'traveler', 'traveler.anna@example.com', 'Анна П.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000202', 'traveler', 'traveler.dmitry@example.com', 'Дмитрий Л.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000203', 'traveler', 'traveler.olga@example.com', 'Ольга М.', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000204', 'traveler', 'traveler.sergey@example.com', 'Сергей Т.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000205', 'traveler', 'traveler.irina@example.com', 'Ирина В.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000206', 'traveler', 'traveler.maksim@example.com', 'Максим К.', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000207', 'traveler', 'traveler.svetlana@example.com', 'Светлана Н.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000208', 'traveler', 'traveler.pavel@example.com', 'Павел Р.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80')
on conflict (id) do update
set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  updated_at = timezone('utc', now());

insert into public.traveler_requests (
  id,
  traveler_id,
  destination,
  region,
  category,
  starts_on,
  ends_on,
  budget_minor,
  currency,
  participants_count,
  format_preference,
  notes,
  open_to_join,
  allow_guide_suggestions,
  group_capacity,
  status
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000201',
    'Элиста, Калмыкия',
    'Калмыкия',
    'Культурный тур',
    date '2026-05-10',
    date '2026-05-16',
    420000,
    'RUB',
    3,
    'Диапазон дат, гибкий старт ±2 дня',
    jsonb_build_object(
      'destinationLabel', 'Элиста, Калмыкия',
      'regionLabel', 'Калмыкия',
      'imageUrl', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'вторая половина мая',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 4800),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 6200),
        jsonb_build_object('groupSize', 4, 'pricePerPersonRub', 9100),
        jsonb_build_object('groupSize', 3, 'pricePerPersonRub', 11800),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 15900)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000202',
    'Казань, Татарстан',
    'Татарстан',
    'Городская экскурсия',
    date '2026-06-01',
    date '2026-06-07',
    520000,
    'RUB',
    2,
    'Диапазон дат, возможен перенос на неделю',
    jsonb_build_object(
      'destinationLabel', 'Казань, Татарстан',
      'regionLabel', 'Татарстан',
      'imageUrl', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'начало июня',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 5200),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 6400),
        jsonb_build_object('groupSize', 5, 'pricePerPersonRub', 7100),
        jsonb_build_object('groupSize', 3, 'pricePerPersonRub', 9800),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 13500)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000203',
    'Санкт-Петербург, Ленобласть',
    'Ленобласть',
    'Культурный тур',
    date '2026-06-12',
    date '2026-06-20',
    680000,
    'RUB',
    4,
    'Период белых ночей, даты согласуем с группой',
    jsonb_build_object(
      'destinationLabel', 'Санкт-Петербург, Ленобласть',
      'regionLabel', 'Ленобласть',
      'imageUrl', 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'середина июня',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 7500),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 9100),
        jsonb_build_object('groupSize', 5, 'pricePerPersonRub', 10300),
        jsonb_build_object('groupSize', 4, 'pricePerPersonRub', 12100),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 19800)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000204',
    'Москва, МО',
    'МО',
    'Смешанный тур',
    date '2026-07-05',
    date '2026-07-12',
    600000,
    'RUB',
    3,
    'Диапазон на июль, точные дни после сбора группы',
    jsonb_build_object(
      'destinationLabel', 'Москва, МО',
      'regionLabel', 'МО',
      'imageUrl', 'https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'первая половина июля',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 6800),
        jsonb_build_object('groupSize', 7, 'pricePerPersonRub', 7300),
        jsonb_build_object('groupSize', 5, 'pricePerPersonRub', 9500),
        jsonb_build_object('groupSize', 3, 'pricePerPersonRub', 13900),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 18400)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000205',
    'Сочи, Краснодарский край',
    'Краснодарский край',
    'Природный тур',
    date '2026-08-10',
    date '2026-08-18',
    740000,
    'RUB',
    2,
    'Период август-сентябрь, старт обсуждается',
    jsonb_build_object(
      'destinationLabel', 'Сочи, Краснодарский край',
      'regionLabel', 'Краснодарский край',
      'imageUrl', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'август, гибкие даты',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 7900),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 9800),
        jsonb_build_object('groupSize', 4, 'pricePerPersonRub', 12800),
        jsonb_build_object('groupSize', 3, 'pricePerPersonRub', 15900),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 21400)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000206',
    'Байкал, Иркутская область',
    'Иркутская область',
    'Природный тур',
    date '2026-09-01',
    date '2026-09-12',
    890000,
    'RUB',
    3,
    'Окно дат по погоде, подтверждение за 2 недели',
    jsonb_build_object(
      'destinationLabel', 'Байкал, Иркутская область',
      'regionLabel', 'Иркутская область',
      'imageUrl', 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'первая половина сентября',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 9600),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 11800),
        jsonb_build_object('groupSize', 5, 'pricePerPersonRub', 13200),
        jsonb_build_object('groupSize', 4, 'pricePerPersonRub', 15500),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 24800)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000207',
    'Казань, Татарстан',
    'Татарстан',
    'Гастрономический тур',
    date '2026-10-01',
    date '2026-10-08',
    560000,
    'RUB',
    2,
    'Осенний период, гибкий выбор выходных',
    jsonb_build_object(
      'destinationLabel', 'Казань, Татарстан',
      'regionLabel', 'Татарстан',
      'imageUrl', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'начало октября',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 5800),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 6900),
        jsonb_build_object('groupSize', 4, 'pricePerPersonRub', 9200),
        jsonb_build_object('groupSize', 3, 'pricePerPersonRub', 11700),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 14900)
      )
    )::text,
    true,
    true,
    8,
    'open'
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000208',
    'Санкт-Петербург, Ленобласть',
    'Ленобласть',
    'Семейный тур',
    date '2026-10-15',
    date '2026-10-25',
    620000,
    'RUB',
    4,
    'Даты в конце октября, точный старт после набора',
    jsonb_build_object(
      'destinationLabel', 'Санкт-Петербург, Ленобласть',
      'regionLabel', 'Ленобласть',
      'imageUrl', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&h=1200&q=80',
      'dateRangeLabel', 'вторая половина октября',
      'priceScenarios', jsonb_build_array(
        jsonb_build_object('groupSize', 8, 'pricePerPersonRub', 6400),
        jsonb_build_object('groupSize', 6, 'pricePerPersonRub', 7900),
        jsonb_build_object('groupSize', 5, 'pricePerPersonRub', 8700),
        jsonb_build_object('groupSize', 4, 'pricePerPersonRub', 10100),
        jsonb_build_object('groupSize', 2, 'pricePerPersonRub', 16200)
      )
    )::text,
    true,
    true,
    8,
    'open'
  )
on conflict (id) do update
set
  traveler_id = excluded.traveler_id,
  destination = excluded.destination,
  region = excluded.region,
  category = excluded.category,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  budget_minor = excluded.budget_minor,
  currency = excluded.currency,
  participants_count = excluded.participants_count,
  format_preference = excluded.format_preference,
  notes = excluded.notes,
  open_to_join = excluded.open_to_join,
  allow_guide_suggestions = excluded.allow_guide_suggestions,
  group_capacity = excluded.group_capacity,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.open_request_members (
  request_id,
  traveler_id,
  status,
  joined_at,
  left_at
)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000201', 'joined', timezone('utc', now()) - interval '12 day', null),
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000202', 'joined', timezone('utc', now()) - interval '11 day', null),
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000203', 'joined', timezone('utc', now()) - interval '9 day', null),

  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000202', 'joined', timezone('utc', now()) - interval '8 day', null),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000205', 'joined', timezone('utc', now()) - interval '7 day', null),

  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000203', 'joined', timezone('utc', now()) - interval '10 day', null),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000204', 'joined', timezone('utc', now()) - interval '8 day', null),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000206', 'joined', timezone('utc', now()) - interval '6 day', null),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000208', 'joined', timezone('utc', now()) - interval '5 day', null),

  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000204', 'joined', timezone('utc', now()) - interval '6 day', null),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000207', 'joined', timezone('utc', now()) - interval '4 day', null),

  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000205', 'joined', timezone('utc', now()) - interval '7 day', null),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000201', 'joined', timezone('utc', now()) - interval '3 day', null),

  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000206', 'joined', timezone('utc', now()) - interval '9 day', null),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000202', 'joined', timezone('utc', now()) - interval '8 day', null),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000203', 'joined', timezone('utc', now()) - interval '7 day', null),

  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000207', 'joined', timezone('utc', now()) - interval '5 day', null),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000208', 'joined', timezone('utc', now()) - interval '4 day', null),

  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000208', 'joined', timezone('utc', now()) - interval '4 day', null),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000201', 'joined', timezone('utc', now()) - interval '3 day', null),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000205', 'joined', timezone('utc', now()) - interval '2 day', null),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000206', 'joined', timezone('utc', now()) - interval '1 day', null)
on conflict (request_id, traveler_id) do update
set
  status = excluded.status,
  joined_at = excluded.joined_at,
  left_at = excluded.left_at;
