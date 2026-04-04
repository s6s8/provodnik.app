-- =============================================================================
-- Provodnik — SEED DATA
-- Run after schema.sql. Safe to re-run (ON CONFLICT DO UPDATE).
--
-- Test accounts (for development/QA):
--   admin@provodnik.test    / Admin1234!    (admin)
--   traveler@provodnik.test / Travel1234!   (traveler)
--   guide@provodnik.test    / Guide1234!    (guide, slug: dmitriy-kozlov)
--
-- Demo accounts (for demos and UI review):
--   admin@provodnik.app     / Demo1234!     (admin)
--   guide@provodnik.app     / Demo1234!     (guide, slug: alexei-sokolov)
--   traveler@provodnik.app  / Demo1234!     (traveler)
--
-- Seed accounts (login: SeedPass1!):
--   5 guides + 8 travelers with listings, requests, offers, bookings, reviews
-- =============================================================================

do $$
declare
  t timestamptz := timezone('utc', now());
begin

-- ---------------------------------------------------------------------------
-- AUTH USERS
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user)
values
  -- test accounts
  ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@provodnik.test',    extensions.crypt('Admin1234!',  extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"role":"admin",   "full_name":"Алексей Смирнов",      "avatar_url":"https://i.pravatar.cc/150?u=admin"}',   t,t,false),
  ('20000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler@provodnik.test', extensions.crypt('Travel1234!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"role":"traveler","full_name":"Мария Иванова",       "avatar_url":"https://i.pravatar.cc/150?u=traveler"}',t,t,false),
  ('30000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide@provodnik.test',    extensions.crypt('Guide1234!',  extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"role":"guide",   "full_name":"Дмитрий Козлов",       "avatar_url":"https://i.pravatar.cc/150?u=guide"}',   t,t,false),
  -- demo accounts
  ('00000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@provodnik.app',    extensions.crypt('Demo1234!',   extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"role":"admin",   "full_name":"Администратор"}',                                                                  t,t,false),
  ('00000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide@provodnik.app',    extensions.crypt('Demo1234!',   extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"role":"guide",   "full_name":"Алексей Соколов"}',                                                               t,t,false),
  ('00000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler@provodnik.app', extensions.crypt('Demo1234!',   extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"role":"traveler","full_name":"Демо Путешественник"}',                                                         t,t,false),
  -- seed guides
  ('10000000-0000-4000-8000-000000000101','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.elista@example.com', extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Елена Воронина"}',    t,t,false),
  ('10000000-0000-4000-8000-000000000102','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.kazan@example.com',  extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Тимур Сафин"}',     t,t,false),
  ('10000000-0000-4000-8000-000000000103','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.spb@example.com',    extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Анна Белова"}',      t,t,false),
  ('10000000-0000-4000-8000-000000000104','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.sochi@example.com',  extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Максим Королёв"}',   t,t,false),
  ('10000000-0000-4000-8000-000000000105','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.baikal@example.com', extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Мария Гречко"}',      t,t,false),
  -- seed travelers
  ('10000000-0000-4000-8000-000000000201','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.anna@example.com',    extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Анна Пахомова"}',      t,t,false),
  ('10000000-0000-4000-8000-000000000202','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.dmitry@example.com',  extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Дмитрий Лазарев"}',    t,t,false),
  ('10000000-0000-4000-8000-000000000203','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.olga@example.com',    extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Ольга Мельникова"}',   t,t,false),
  ('10000000-0000-4000-8000-000000000204','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.sergey@example.com',  extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Сергей Тарасов"}',     t,t,false),
  ('10000000-0000-4000-8000-000000000205','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.irina@example.com',   extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Ирина Власова"}',      t,t,false),
  ('10000000-0000-4000-8000-000000000206','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.maksim@example.com',  extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Максим Кудрявцев"}',   t,t,false),
  ('10000000-0000-4000-8000-000000000207','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.svetlana@example.com',extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Светлана Никитина"}', t,t,false),
  ('10000000-0000-4000-8000-000000000208','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.pavel@example.com',   extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),t,'{"provider":"email","providers":["email"]}','{"full_name":"Павел Романов"}',      t,t,false)
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = t;

-- provider_id = user UUID (not email) — required by GoTrue v2
insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','{"sub":"10000000-0000-4000-8000-000000000001","email":"admin@provodnik.test","email_verified":true,"phone_verified":false}'::jsonb,          'email', t, t, t),
  (gen_random_uuid(),'20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','{"sub":"20000000-0000-4000-8000-000000000001","email":"traveler@provodnik.test","email_verified":true,"phone_verified":false}'::jsonb,       'email', t, t, t),
  (gen_random_uuid(),'30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','{"sub":"30000000-0000-4000-8000-000000000001","email":"guide@provodnik.test","email_verified":true,"phone_verified":false}'::jsonb,          'email', t, t, t),
  (gen_random_uuid(),'00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','{"sub":"00000000-0000-4000-8000-000000000001","email":"admin@provodnik.app","email_verified":true,"phone_verified":false}'::jsonb,           'email', t, t, t),
  (gen_random_uuid(),'00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','{"sub":"00000000-0000-4000-8000-000000000002","email":"guide@provodnik.app","email_verified":true,"phone_verified":false}'::jsonb,           'email', t, t, t),
  (gen_random_uuid(),'00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000003','{"sub":"00000000-0000-4000-8000-000000000003","email":"traveler@provodnik.app","email_verified":true,"phone_verified":false}'::jsonb,        'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000101','{"sub":"10000000-0000-4000-8000-000000000101","email":"guide.elista@example.com","email_verified":true,"phone_verified":false}'::jsonb,      'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000102','{"sub":"10000000-0000-4000-8000-000000000102","email":"guide.kazan@example.com","email_verified":true,"phone_verified":false}'::jsonb,       'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000103','{"sub":"10000000-0000-4000-8000-000000000103","email":"guide.spb@example.com","email_verified":true,"phone_verified":false}'::jsonb,         'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000104','10000000-0000-4000-8000-000000000104','{"sub":"10000000-0000-4000-8000-000000000104","email":"guide.sochi@example.com","email_verified":true,"phone_verified":false}'::jsonb,       'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000105','10000000-0000-4000-8000-000000000105','{"sub":"10000000-0000-4000-8000-000000000105","email":"guide.baikal@example.com","email_verified":true,"phone_verified":false}'::jsonb,      'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000201','10000000-0000-4000-8000-000000000201','{"sub":"10000000-0000-4000-8000-000000000201","email":"traveler.anna@example.com","email_verified":true,"phone_verified":false}'::jsonb,     'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000202','10000000-0000-4000-8000-000000000202','{"sub":"10000000-0000-4000-8000-000000000202","email":"traveler.dmitry@example.com","email_verified":true,"phone_verified":false}'::jsonb,   'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000203','10000000-0000-4000-8000-000000000203','{"sub":"10000000-0000-4000-8000-000000000203","email":"traveler.olga@example.com","email_verified":true,"phone_verified":false}'::jsonb,     'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000204','10000000-0000-4000-8000-000000000204','{"sub":"10000000-0000-4000-8000-000000000204","email":"traveler.sergey@example.com","email_verified":true,"phone_verified":false}'::jsonb,   'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000205','10000000-0000-4000-8000-000000000205','{"sub":"10000000-0000-4000-8000-000000000205","email":"traveler.irina@example.com","email_verified":true,"phone_verified":false}'::jsonb,    'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000206','10000000-0000-4000-8000-000000000206','{"sub":"10000000-0000-4000-8000-000000000206","email":"traveler.maksim@example.com","email_verified":true,"phone_verified":false}'::jsonb,   'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000207','10000000-0000-4000-8000-000000000207','{"sub":"10000000-0000-4000-8000-000000000207","email":"traveler.svetlana@example.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', t, t, t),
  (gen_random_uuid(),'10000000-0000-4000-8000-000000000208','10000000-0000-4000-8000-000000000208','{"sub":"10000000-0000-4000-8000-000000000208","email":"traveler.pavel@example.com","email_verified":true,"phone_verified":false}'::jsonb,    'email', t, t, t)
on conflict (provider, provider_id) do nothing;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
insert into public.profiles (id, role, email, full_name, avatar_url) values
  -- test accounts
  ('10000000-0000-4000-8000-000000000001','admin',   'admin@provodnik.test',    'Алексей Смирнов',      'https://i.pravatar.cc/150?u=admin'),
  ('20000000-0000-4000-8000-000000000001','traveler','traveler@provodnik.test', 'Мария Иванова',        'https://i.pravatar.cc/150?u=traveler'),
  ('30000000-0000-4000-8000-000000000001','guide',   'guide@provodnik.test',    'Дмитрий Козлов',       'https://i.pravatar.cc/150?u=guide'),
  -- demo accounts
  ('00000000-0000-4000-8000-000000000001','admin',   'admin@provodnik.app',    'Администратор',         null),
  ('00000000-0000-4000-8000-000000000002','guide',   'guide@provodnik.app',    'Алексей Соколов',       'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  ('00000000-0000-4000-8000-000000000003','traveler','traveler@provodnik.app', 'Демо Путешественник',   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80'),
  -- seed guides
  ('10000000-0000-4000-8000-000000000101','guide',   'guide.elista@example.com', 'Елена Воронина', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000102','guide',   'guide.kazan@example.com',  'Тимур Сафин',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000103','guide',   'guide.spb@example.com',    'Анна Белова',    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000104','guide',   'guide.sochi@example.com',  'Максим Королёв', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000105','guide',   'guide.baikal@example.com', 'Мария Гречко',   'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  -- seed travelers
  ('10000000-0000-4000-8000-000000000201','traveler','traveler.anna@example.com',    'Анна Пахомова',     'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000202','traveler','traveler.dmitry@example.com',  'Дмитрий Лазарев',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000203','traveler','traveler.olga@example.com',    'Ольга Мельникова',  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000204','traveler','traveler.sergey@example.com',  'Сергей Тарасов',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000205','traveler','traveler.irina@example.com',   'Ирина Власова',     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000206','traveler','traveler.maksim@example.com',  'Максим Кудрявцев',  'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000207','traveler','traveler.svetlana@example.com','Светлана Никитина', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000208','traveler','traveler.pavel@example.com',   'Павел Романов',     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80')
on conflict (id) do update set
  role = excluded.role, email = excluded.email,
  full_name = excluded.full_name, avatar_url = excluded.avatar_url, updated_at = t;

-- ---------------------------------------------------------------------------
-- GUIDE PROFILES
-- ---------------------------------------------------------------------------
insert into public.guide_profiles (user_id, slug, display_name, bio, years_experience, regions, languages, specialties, specialization, attestation_status, verification_status, verification_notes, payout_account_label, rating, completed_tours, is_available) values
  ('30000000-0000-4000-8000-000000000001','dmitriy-kozlov','Дмитрий Козлов','Веду насыщенные маршруты по Москве и Подмосковью с акцентом на историю города, удобную логистику и спокойный темп для семьи или небольшой группы.',8,array['Москва','Подмосковье','Коломна'],array['Русский','English'],array['Городские прогулки','История','Семейные маршруты'],'Городские прогулки','Сертифицированный гид','approved','Базовый тестовый профиль для QA и ручной проверки маршрутов.','Тестовый профиль',4.9,47,true),
  ('00000000-0000-4000-8000-000000000002','alexei-sokolov','Алексей Соколов','Показываю Москву тем, кто хочет увидеть не только открытки, но и живой ритм столицы. Составляю маршрут под интересы группы и держу плотный, но комфортный тайминг.',10,array['Москва','Зеленоград','Сергиев Посад'],array['Русский','Английский'],array['Городские экскурсии','Архитектура','Культура'],'Городские экскурсии','Рейтинг 4.9','approved','Демо-профиль для публичных страниц и карточек гида.','СБП • Москва',4.9,42,true),
  ('10000000-0000-4000-8000-000000000101','elena-voronina','Елена Воронина','Провожу авторские прогулки по Москве и ближнему Подмосковью. Люблю связывать знаковые места с локальными историями, музеями и небольшими гастроостановками.',9,array['Москва','Подмосковье','Сергиев Посад'],array['Русский','Английский'],array['Городские экскурсии','Культура','Музеи'],'Культура','Подтверждённый партнёр','approved','Профиль обновлён под стартовое SEO-наполнение по региону запуска.','СБП • Москва',4.8,28,true),
  ('10000000-0000-4000-8000-000000000102','timur-safin','Тимур Сафин','Работаю с маршрутами по Казани, где история города соединяется с татарской гастрономией и современной городской жизнью. Хорошо веду небольшие группы и семейные поездки.',7,array['Казань','Татарстан','Свияжск'],array['Русский','Татарский','Английский'],array['Гастрономия','История','Семейные маршруты'],'Гастрономия','Рейтинг 4.9','approved','Публичный рейтинг: 4.9/5.0','СБП • Татарстан',4.9,35,true),
  ('10000000-0000-4000-8000-000000000103','anna-belova','Анна Белова','Собираю культурные маршруты по Санкт-Петербургу: от классических парадных ансамблей до камерных дворов и вечерних прогулок у воды. Умею подстраивать программу под сезон и погоду.',8,array['Санкт-Петербург','Ленинградская область','Кронштадт'],array['Русский','Английский'],array['Архитектура','Культура','Фотопрогулки'],'Культура','Рейтинг 5.0','approved','Публичный рейтинг: 5.0/5.0','СБП • Санкт-Петербург',5.0,51,true),
  ('10000000-0000-4000-8000-000000000104','maksim-korolev','Максим Королёв','Показываю Нижний Новгород с акцентом на стрелку, купеческие кварталы и видовые точки над Волгой и Окой. Люблю сочетать историю, локальную еду и короткие выезды на природу.',6,array['Нижний Новгород','Нижегородская область','Бор'],array['Русский'],array['История','Городские туры','Природа'],'История','Проверка документов в работе','submitted','Профиль подготовлен для очереди верификации перед запуском.','СБП • Нижний Новгород',4.6,14,true),
  ('10000000-0000-4000-8000-000000000105','maria-grechko','Мария Гречко','Веду маршруты по Сочи и Красной Поляне с фокусом на мягкие природные прогулки, локальную кухню и маршруты, которые не разваливаются из-за погоды. Подходит и для пары, и для семьи.',10,array['Сочи','Красная Поляна','Краснодарский край'],array['Русский','Английский'],array['Природа','Еда','Семейные поездки'],'Природа','Рейтинг 4.9','approved','Публичный рейтинг: 4.9/5.0','СБП • Сочи',4.9,38,true)
on conflict (user_id) do update set
  slug = excluded.slug, display_name = excluded.display_name, bio = excluded.bio,
  years_experience = excluded.years_experience, regions = excluded.regions,
  languages = excluded.languages, specialties = excluded.specialties,
  specialization = excluded.specialization, verification_status = excluded.verification_status,
  rating = excluded.rating, completed_tours = excluded.completed_tours,
  is_available = excluded.is_available, updated_at = t;

-- ---------------------------------------------------------------------------
-- LISTINGS
-- ---------------------------------------------------------------------------
insert into public.listings (id,guide_id,slug,title,region,city,category,route_summary,description,duration_minutes,max_group_size,price_from_minor,currency,private_available,group_available,instant_book,meeting_point,inclusions,exclusions,cancellation_policy_key,status,featured_rank) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000101','moscow-boulevards-and-hidden-yards','Москва за один день: бульвары, переулки и тихие дворы','Москва','Москва','Городская экскурсия','Тверской бульвар -> Патриаршие пруды -> Хитровка -> Ивановская горка','Пеший маршрут по центру Москвы для тех, кто хочет увидеть город без перегруза фактами и очередями. Подходит для первого знакомства со столицей и спокойной прогулки в небольшой группе.',240,8,450000,'RUB',true,true,false,'Москва, метро Тверская',array['Услуги гида','Небольшая кофейная пауза'],array['Билеты в музеи','Личные расходы'],'flexible','published',1),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000102','kazan-kremlin-and-tatar-flavors','Казань: кремль, озеро Кабан и татарские вкусы','Татарстан','Казань','Гастрономическая экскурсия','Казанский кремль -> Старо-Татарская слобода -> озеро Кабан -> семейное кафе','Маршрут соединяет главные исторические точки города с двумя гастроостановками и разговорами о татарской культуре. Хорошо работает для пары, семьи или друзей, которые хотят город без спешки.',300,8,650000,'RUB',true,true,false,'Казань, у башни Сююмбике',array['Услуги гида','Дегустация чак-чака'],array['Основной обед','Личные покупки'],'flexible','published',2),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000103','saint-petersburg-white-nights-walk','Санкт-Петербург: парадный центр и прогулка в ритме белых ночей','Санкт-Петербург','Санкт-Петербург','Культурная прогулка','Дворцовая площадь -> Мойка -> Летний сад -> набережная Фонтанки','Неспешная прогулка по центральным ансамблям Петербурга с акцентом на городские истории, архитектуру и удобные точки для фото. Маршрут рассчитан на вечернее время и хорошо подходит для первого визита.',270,6,720000,'RUB',true,true,false,'Санкт-Петербург, станция Невский проспект',array['Услуги гида','Маршрутный лист с рекомендациями'],array['Транспорт до места старта','Билеты в музеи'],'moderate','published',3),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000104','nizhny-arrows-and-merchant-streets','Нижний Новгород: стрелка, кремль и купеческие улицы','Нижегородская область','Нижний Новгород','Историческая прогулка','Стрелка -> Рождественская -> Нижегородский кремль -> Верхне-Волжская набережная','Маршрут показывает панорамы слияния Оки и Волги, торговую историю города и его спокойный темп. Подходит для тех, кто хочет увидеть Нижний не галопом, а через понятный городской контекст.',300,6,580000,'RUB',true,true,false,'Нижний Новгород, станция Горьковская',array['Услуги гида','Небольшой локальный перекус'],array['Билеты на выставки','Личные расходы'],'flexible','published',4),
  ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000105','sochi-sea-tea-and-viewpoints','Сочи: море, чайные плантации и видовые точки','Краснодарский край','Сочи','Природный маршрут','Морской вокзал -> Мацеста -> чайные плантации -> смотровая в Хосте','Поездка собирает море, зелёные локации и лёгкий выезд за пределы центра. Формат подходит для тех, кто хочет день на воздухе без тяжёлого трекинга и длинных переездов.',360,7,680000,'RUB',true,true,false,'Сочи, Морской вокзал',array['Услуги гида','Транспорт между точками'],array['Канатная дорога','Полноценный обед'],'moderate','published',5),
  ('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000101','moscow-estates-and-pine-towns','Подмосковье на день: усадьба, сосновый городок и спокойный выезд из Москвы','Московская область','Москва','Город + природа','Саввино-Сторожевский монастырь -> Звенигород -> Архангельское','Выездной маршрут для тех, кто хочет сменить городской ритм и увидеть Подмосковье без сложной логистики. В программе история усадеб, короткие прогулки и время на обед в дороге.',480,6,1250000,'RUB',true,true,false,'Москва, метро Белорусская',array['Услуги гида','Транспорт','Подбор кафе'],array['Входные билеты','Личные покупки'],'moderate','published',6),
  ('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000102','kazan-family-riverside-day','Казань для семьи: набережная, дворики и короткий маршрут без спешки','Татарстан','Казань','Семейная прогулка','Кремлёвская набережная -> детские локации у Кабана -> дворики центра','Лёгкая семейная программа без длинных переходов и сложной логистики. Маршрут можно адаптировать под детей, возраст группы и погодные условия.',180,5,300000,'RUB',true,true,false,'Казань, площадь 1 Мая',array['Услуги гида'],array['Еда','Билеты на аттракционы'],'flexible','draft',null),
  ('20000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000002','moscow-grand-tour-for-guests','Большая Москва для гостей города: центр, музей и вечерний вид','Москва','Москва','Культура','Зарядье -> Варварка -> Третьяковка -> смотровая площадка Москва-Сити','Насыщенная программа для гостей столицы, которые хотят закрыть главные точки за один день и не потеряться в пересадках. Подходит для индивидуальных путешественников и маленьких групп.',600,6,2500000,'RUB',true,false,true,'Москва, парк Зарядье',array['Услуги гида','Бронирование тайм-слота в музей','Сопровождение на всём маршруте'],array['Билеты в музей','Питание'],'strict','draft',null)
on conflict (id) do update set
  title = excluded.title, status = excluded.status, featured_rank = excluded.featured_rank, updated_at = t;

-- ---------------------------------------------------------------------------
-- TRAVELER REQUESTS
-- ---------------------------------------------------------------------------
insert into public.traveler_requests (id,traveler_id,destination,region,category,starts_on,ends_on,budget_minor,currency,participants_count,format_preference,notes,open_to_join,allow_guide_suggestions,group_capacity,status) values
  ('30000000-0000-4000-8000-000000000000','00000000-0000-4000-8000-000000000003','Москва, Россия','Москва','Городская экскурсия',date '2026-07-20',date '2026-07-22',480000,'RUB',2,'Нужен маршрут по центру с музеем и без долгих переездов.',null,true,true,4,'open'),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','Москва, Московская область','Московская область','Культурный тур',date '2026-05-10',date '2026-05-11',350000,'RUB',3,'Ищем выезд в Подмосковье на один день с историей и обедом.',null,true,true,6,'open'),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000202','Казань, Россия','Татарстан','Гастрономическая экскурсия',date '2026-06-01',date '2026-06-03',420000,'RUB',2,'Хотим увидеть кремль и попробовать локальные блюда без толпы.',null,true,true,5,'open'),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000203','Санкт-Петербург, Россия','Санкт-Петербург','Культурный тур',date '2026-06-12',date '2026-06-15',540000,'RUB',4,'Интересуют белые ночи, архитектура и удобный маршрут для родителей.',null,true,true,6,'open'),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000204','Нижний Новгород, Россия','Нижегородская область','Историческая прогулка',date '2026-07-05',date '2026-07-07',310000,'RUB',3,'Нужен гид по кремлю и набережным, без длинных переходов.',null,true,true,5,'open'),
  ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000205','Сочи, Россия','Краснодарский край','Природный тур',date '2026-08-10',date '2026-08-13',500000,'RUB',2,'Хочется совместить море, зелёные локации и лёгкую прогулку в горах.',null,true,true,4,'open'),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000206','Москва, Россия','Москва','Семейная экскурсия',date '2026-09-01',date '2026-09-02',280000,'RUB',3,'Ищем мягкий семейный формат с остановками и детскими паузами.',null,true,true,5,'open'),
  ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000207','Казань, Россия','Татарстан','Гастрономический тур',date '2026-10-01',date '2026-10-02',260000,'RUB',2,'Нужен вечерний маршрут по центру и хорошая местная кухня.',null,true,true,4,'open'),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000208','Санкт-Петербург, Россия','Санкт-Петербург','Семейный тур',date '2026-10-15',date '2026-10-17',460000,'RUB',4,'Хотим спокойный маршрут по центру и короткую прогулку у воды.',null,true,true,6,'open')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- OPEN REQUEST MEMBERS
-- ---------------------------------------------------------------------------
insert into public.open_request_members (request_id,traveler_id,status,joined_at) values
  ('30000000-0000-4000-8000-000000000000','00000000-0000-4000-8000-000000000003','joined',t-interval '2 day'),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','joined',t-interval '12 day'),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000202','joined',t-interval '11 day'),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000203','joined',t-interval '9 day'),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000202','joined',t-interval '8 day'),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000205','joined',t-interval '7 day'),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000203','joined',t-interval '10 day'),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000204','joined',t-interval '8 day'),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000206','joined',t-interval '6 day'),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000208','joined',t-interval '5 day'),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000204','joined',t-interval '6 day'),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000207','joined',t-interval '4 day'),
  ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000205','joined',t-interval '7 day'),
  ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000201','joined',t-interval '3 day'),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000206','joined',t-interval '9 day'),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000202','joined',t-interval '8 day'),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000203','joined',t-interval '7 day'),
  ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000207','joined',t-interval '5 day'),
  ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000208','joined',t-interval '4 day'),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000208','joined',t-interval '4 day'),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000201','joined',t-interval '3 day'),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000205','joined',t-interval '2 day'),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000206','joined',t-interval '1 day')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- GUIDE OFFERS
-- ---------------------------------------------------------------------------
insert into public.guide_offers (id,request_id,guide_id,listing_id,title,message,price_minor,currency,capacity,starts_at,ends_at,inclusions,expires_at,status) values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000000','00000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000008','Большая Москва для гостей города: центр, музей и вечерний вид','Предлагаю закрыть главные точки центра за один день и спокойно пройти маршрут без сложных пересадок.',2450000,'RUB',4,'2026-07-20 09:00+00','2026-07-20 19:00+00',array['Гид','Маршрутный лист','Бронирование слота в музей'],t+interval '14 day','pending'),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000008','Москва для семьи: спокойный маршрут с паузами','Соберу мягкую программу по центру с удобными остановками и временем на детей.',1180000,'RUB',5,'2026-09-01 09:00+00','2026-09-01 17:00+00',array['Гид','Помощь с логистикой','Подсказки по кафе'],t+interval '21 day','pending'),
  ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000002','Казань: кремль, озеро Кабан и татарские вкусы','Покажу центр города и заведу в проверенные места без туристической суеты.',650000,'RUB',8,'2026-06-01 09:00+00','2026-06-01 15:00+00',array['Гид','Дегустация чак-чака'],t+interval '10 day','pending')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------------
insert into public.bookings (id,traveler_id,guide_id,request_id,offer_id,listing_id,status,party_size,starts_at,ends_at,subtotal_minor,deposit_minor,remainder_minor,currency,cancellation_policy_snapshot,meeting_point) values
  ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','10000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000001',null,'20000000-0000-4000-8000-000000000001','completed',3,'2026-05-10 10:00+00','2026-05-10 15:00+00',1350000,405000,0,'RUB','{"policy":"flexible","description":"Бесплатная отмена за 7 дней"}','Москва, метро Тверская'),
  ('60000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000000','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000008','confirmed',2,'2026-07-20 09:00+00','2026-07-20 19:00+00',2450000,735000,1715000,'RUB','{"policy":"moderate","description":"Отмена за 14 дней — возврат депозита 50%"}','Москва, парк Зарядье')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------------
insert into public.reviews (id,booking_id,traveler_id,guide_id,listing_id,rating,title,body,status) values
  ('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001',5,'Спокойная и очень живая прогулка по Москве','Елена хорошо собрала маршрут по центру: без суеты, с понятными переходами и интересными историями по дороге. Для короткой поездки в Москву это оказался идеальный формат.','published')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------------------------
insert into public.favorites (id,user_id,subject,listing_id,guide_id) values
  ('80000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','listing','20000000-0000-4000-8000-000000000005',null),
  ('80000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','guide',null,'00000000-0000-4000-8000-000000000002')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- QUALITY SNAPSHOTS
-- ---------------------------------------------------------------------------
insert into public.quality_snapshots (subject_type,subject_slug,tier,response_time_hours,completion_rate,rating_avg,review_count) values
  ('guide','dmitriy-kozlov',                      'gold',  2.0,0.99,4.9,47),
  ('guide','alexei-sokolov',                      'gold',  2.5,0.98,4.9,42),
  ('guide','elena-voronina',                      'gold',  3.0,0.95,4.8,28),
  ('guide','timur-safin',                         'silver',4.5,0.92,4.9,35),
  ('guide','anna-belova',                         'gold',  2.0,0.97,5.0,51),
  ('guide','maksim-korolev',                      'silver',5.0,0.90,4.6,14),
  ('guide','maria-grechko',                       'gold',  2.8,0.96,4.9,38),
  ('listing','moscow-boulevards-and-hidden-yards','silver',null,null,4.8,12),
  ('listing','kazan-kremlin-and-tatar-flavors',  'gold',  null,null,4.9,24),
  ('listing','saint-petersburg-white-nights-walk','gold', null,null,5.0,18),
  ('listing','nizhny-arrows-and-merchant-streets','silver',null,null,4.6,9),
  ('listing','sochi-sea-tea-and-viewpoints',     'gold',  null,null,4.9,31),
  ('listing','moscow-estates-and-pine-towns',    'silver',null,null,4.8,15),
  ('listing','moscow-grand-tour-for-guests',     'gold',  null,null,4.9,22)
on conflict (subject_type, subject_slug) do update set
  tier = excluded.tier, rating_avg = excluded.rating_avg,
  review_count = excluded.review_count, updated_at = t;

-- ---------------------------------------------------------------------------
-- DESTINATIONS
-- ---------------------------------------------------------------------------
insert into public.destinations (slug,name,region,category,description,hero_image_url,listing_count,guides_count,rating) values
  ('moscow',           'Москва',            'Москва',                'city','Москва подходит для первого знакомства с Россией и для повторных поездок, когда хочется копнуть глубже. Здесь легко собрать маршрут из истории, архитектуры, музеев и спокойных гастроостановок в одном дне.','https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80',3,3,4.9),
  ('saint-petersburg', 'Санкт-Петербург',   'Санкт-Петербург',       'culture','Санкт-Петербург работает на длинную прогулку и мягкий вечерний ритм. Сюда едут за архитектурой, водой, камерными дворами и маршрутами, которые хорошо проживаются даже без спешки.','https://images.unsplash.com/photo-1520637836862-4d197d17c55a?auto=format&fit=crop&w=1600&h=1200&q=80',1,1,5.0),
  ('kazan-tatarstan',  'Казань',            'Татарстан',             'culture','Казань удобна для короткой поездки на выходные и для насыщенного гастрономического маршрута. Исторический центр, татарская кухня и спокойная логистика делают город понятным уже с первого дня.','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80',2,1,4.9),
  ('nizhny-novgorod',  'Нижний Новгород',   'Нижегородская область', 'city','Нижний Новгород даёт сильные панорамы и ощущение большого исторического города без столичной суеты. Здесь удобно сочетать кремль, купеческие улицы и короткие выезды к воде или на природу.','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80',1,1,4.6),
  ('sochi',            'Сочи',              'Краснодарский край',    'nature','Сочи позволяет за один маршрут соединить море, субтропическую зелень и горные виды. Это хороший запусковый регион для мягких природных программ и семейных поездок без экстремальной нагрузки.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=1200&q=80',1,1,4.9)
on conflict (slug) do update set
  listing_count = excluded.listing_count, guides_count = excluded.guides_count,
  rating = excluded.rating, updated_at = t;

end $$;
