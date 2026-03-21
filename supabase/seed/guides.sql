-- Seed: профили гидов (>=4) с аватарами, специализациями и городами.

insert into public.profiles (id, role, email, full_name, avatar_url)
values
  (
    '10000000-0000-4000-8000-000000000101',
    'guide',
    'guide.elista@example.com',
    'Баир Н.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    'guide',
    'guide.kazan@example.com',
    'Тимур Х.',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'
  ),
  (
    '10000000-0000-4000-8000-000000000103',
    'guide',
    'guide.spb@example.com',
    'Анна В.',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80'
  ),
  (
    '10000000-0000-4000-8000-000000000104',
    'guide',
    'guide.sochi@example.com',
    'Мария К.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'
  ),
  (
    '10000000-0000-4000-8000-000000000105',
    'guide',
    'guide.baikal@example.com',
    'Алексей С.',
    'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'
  )
on conflict (id) do update
set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (
  user_id,
  slug,
  display_name,
  bio,
  years_experience,
  regions,
  languages,
  specialties,
  attestation_status,
  verification_status,
  verification_notes,
  payout_account_label
)
values
  (
    '10000000-0000-4000-8000-000000000101',
    'bair-elista',
    'Баир Н.',
    'Провожу авторские маршруты по Элисте и степным локациям Калмыкии. Делаю спокойный темп и понятную логистику для групп, которые едут впервые.',
    9,
    array['Элиста', 'Калмыкия', 'Адык'],
    array['Русский'],
    array['Буддийская культура', 'Этномаршруты', 'История региона'],
    'Рейтинг 4.8',
    'approved',
    'Публичный рейтинг: 4.8/5.0',
    'СБП • Калмыкия'
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    'timur-kazan',
    'Тимур Х.',
    'Работаю с городскими маршрутами по Казани и выездами в Свияжск. Фокус на истории, еде и комфортном темпе для группы 2-8 человек.',
    7,
    array['Казань', 'Татарстан', 'Свияжск'],
    array['Русский', 'Татарский', 'Английский'],
    array['Гастрономия', 'Исторические прогулки', 'Семейные маршруты'],
    'Рейтинг 4.9',
    'approved',
    'Публичный рейтинг: 4.9/5.0',
    'СБП • Татарстан'
  ),
  (
    '10000000-0000-4000-8000-000000000103',
    'anna-petersburg',
    'Анна В.',
    'Собираю культурные и вечерние программы по Санкт-Петербургу и Ленобласти. Маршруты построены так, чтобы сочетать знаковые места и локальные улицы без спешки.',
    8,
    array['Санкт-Петербург', 'Ленобласть', 'Кронштадт'],
    array['Русский', 'Английский'],
    array['Архитектура', 'История', 'Фотопрогулки'],
    'Рейтинг 5.0',
    'approved',
    'Публичный рейтинг: 5.0/5.0',
    'СБП • Санкт-Петербург'
  ),
  (
    '10000000-0000-4000-8000-000000000104',
    'maria-sochi',
    'Мария К.',
    'Веду маршруты по Сочи и Красной Поляне с гибким сценарием по погоде. Хорошо подстраиваю программу под семьи и небольшие корпоративные группы.',
    6,
    array['Сочи', 'Красная Поляна', 'Краснодарский край'],
    array['Русский', 'Английский'],
    array['Природа', 'Семейные поездки', 'Город + горы'],
    'Рейтинг 4.7',
    'approved',
    'Публичный рейтинг: 4.7/5.0',
    'СБП • Краснодарский край'
  ),
  (
    '10000000-0000-4000-8000-000000000105',
    'alexei-baikal',
    'Алексей С.',
    'Специализируюсь на программах по Байкалу и Иркутской области. Планирую маршруты с запасом по времени и безопасной транспортной логистикой.',
    10,
    array['Байкал', 'Иркутск', 'Иркутская область', 'Ольхон'],
    array['Русский', 'Английский', 'Немецкий'],
    array['Природные маршруты', 'Ледовые туры', 'Фотография'],
    'Рейтинг 4.9',
    'approved',
    'Публичный рейтинг: 4.9/5.0',
    'СБП • Иркутская область'
  )
on conflict (user_id) do update
set
  slug = excluded.slug,
  display_name = excluded.display_name,
  bio = excluded.bio,
  years_experience = excluded.years_experience,
  regions = excluded.regions,
  languages = excluded.languages,
  specialties = excluded.specialties,
  attestation_status = excluded.attestation_status,
  verification_status = excluded.verification_status,
  verification_notes = excluded.verification_notes,
  payout_account_label = excluded.payout_account_label,
  updated_at = timezone('utc', now());
