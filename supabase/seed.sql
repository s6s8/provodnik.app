-- =============================================================================
-- Provodnik — полный сид Supabase (IDEMPOTENT — safe to re-run)
-- Запускать ПОСЛЕ миграций (migrations/*.sql).
--
-- Демо-аккаунты (логин / пароль):
--   admin@provodnik.app     / Demo1234!   (роль admin)
--   guide@provodnik.app     / Demo1234!   (роль guide,  slug: alexei-sokolov)
--   traveler@provodnik.app  / Demo1234!   (роль traveler)
--
-- Seed accounts (login: SeedPass1!):
--   5 guides + 8 travelers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. FULL WIPE — safe, entire DB is seed data
-- ---------------------------------------------------------------------------
truncate public.marketplace_events cascade;
do $$ begin
  execute 'truncate public.quality_snapshots cascade';
exception when undefined_table then null;
end $$;
truncate public.reviews cascade;
truncate public.favorites cascade;
truncate public.bookings cascade;
truncate public.guide_offers cascade;
truncate public.open_request_members cascade;
truncate public.traveler_requests cascade;
truncate public.listings cascade;
truncate public.guide_profiles cascade;
truncate public.profiles cascade;
delete from auth.users;
delete from auth.identities;

-- ---------------------------------------------------------------------------
-- 1. AUTH USERS
-- ---------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user
)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@provodnik.app',    extensions.crypt('Demo1234!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Администратор"}',     timezone('utc',now()),timezone('utc',now()),false),
  ('00000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide@provodnik.app',    extensions.crypt('Demo1234!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Алексей Соколов"}',   timezone('utc',now()),timezone('utc',now()),false),
  ('00000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler@provodnik.app', extensions.crypt('Demo1234!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Демо Путешественник"}',timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000101','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.elista@example.com',   extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Баир Н."}',           timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000102','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.kazan@example.com',     extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Тимур Х."}',          timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000103','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.spb@example.com',       extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Анна В."}',           timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000104','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.sochi@example.com',     extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Мария К."}',          timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000105','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide.baikal@example.com',    extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Алексей С."}',        timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000201','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.anna@example.com',   extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Анна П."}',           timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000202','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.dmitry@example.com', extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Дмитрий Л."}',        timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000203','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.olga@example.com',   extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Ольга М."}',          timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000204','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.sergey@example.com', extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Сергей Т."}',         timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000205','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.irina@example.com',  extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Ирина В."}',          timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000206','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.maksim@example.com', extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Максим К."}',         timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000207','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.svetlana@example.com',extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Светлана Н."}',       timezone('utc',now()),timezone('utc',now()),false),
  ('10000000-0000-4000-8000-000000000208','00000000-0000-0000-0000-000000000000','authenticated','authenticated','traveler.pavel@example.com',  extensions.crypt('SeedPass1!',extensions.gen_salt('bf')),timezone('utc',now()),'{"provider":"email","providers":["email"]}','{"full_name":"Павел Р."}',          timezone('utc',now()),timezone('utc',now()),false)
on conflict (id) do update set email=excluded.email, encrypted_password=excluded.encrypted_password, updated_at=timezone('utc',now());

-- ---------------------------------------------------------------------------
-- 2. PROFILES
-- ---------------------------------------------------------------------------
insert into public.profiles (id, role, email, full_name, avatar_url) values
  ('00000000-0000-4000-8000-000000000001','admin',   'admin@provodnik.app',   'Администратор',      null),
  ('00000000-0000-4000-8000-000000000002','guide',   'guide@provodnik.app',   'Алексей Соколов',    'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  ('00000000-0000-4000-8000-000000000003','traveler','traveler@provodnik.app','Демо Путешественник','https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000101','guide',   'guide.elista@example.com',   'Баир Н.',     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000102','guide',   'guide.kazan@example.com',    'Тимур Х.',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000103','guide',   'guide.spb@example.com',      'Анна В.',     'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000104','guide',   'guide.sochi@example.com',    'Мария К.',    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000105','guide',   'guide.baikal@example.com',   'Алексей С.',  'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000201','traveler','traveler.anna@example.com',   'Анна П.',     'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000202','traveler','traveler.dmitry@example.com', 'Дмитрий Л.',  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000203','traveler','traveler.olga@example.com',   'Ольга М.',    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000204','traveler','traveler.sergey@example.com', 'Сергей Т.',   'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000205','traveler','traveler.irina@example.com',  'Ирина В.',    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000206','traveler','traveler.maksim@example.com', 'Максим К.',   'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000207','traveler','traveler.svetlana@example.com','Светлана Н.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80'),
  ('10000000-0000-4000-8000-000000000208','traveler','traveler.pavel@example.com',  'Павел Р.',    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80')
on conflict (id) do update set role=excluded.role, email=excluded.email, full_name=excluded.full_name, avatar_url=excluded.avatar_url, updated_at=timezone('utc',now());

-- ---------------------------------------------------------------------------
-- 3. GUIDE PROFILES
-- ---------------------------------------------------------------------------
insert into public.guide_profiles (user_id, slug, display_name, bio, years_experience, regions, languages, specialties, attestation_status, verification_status, verification_notes, payout_account_label) values
  ('00000000-0000-4000-8000-000000000002','alexei-sokolov','Алексей Соколов','Специализируюсь на программах по Байкалу и Иркутской области. Планирую маршруты с запасом по времени и безопасной транспортной логистикой.',10,array['Байкал','Иркутск','Иркутская область','Ольхон'],array['Русский','Английский','Немецкий'],array['Природные маршруты','Ледовые туры','Фотография'],'Рейтинг 4.9','approved','Публичный рейтинг: 4.9/5.0','СБП • Иркутская область'),
  ('10000000-0000-4000-8000-000000000101','bair-elista','Баир Н.','Провожу авторские маршруты по Элисте и степным локациям Калмыкии. Делаю спокойный темп и понятную логистику для групп.',9,array['Элиста','Калмыкия','Адык'],array['Русский'],array['Буддийская культура','Этномаршруты','История региона'],'Рейтинг 4.8','approved','Публичный рейтинг: 4.8/5.0','СБП • Калмыкия'),
  ('10000000-0000-4000-8000-000000000102','timur-kazan','Тимур Х.','Работаю с городскими маршрутами по Казани и выездами в Свияжск. Фокус на истории, еде и комфортном темпе.',7,array['Казань','Татарстан','Свияжск'],array['Русский','Татарский','Английский'],array['Гастрономия','Исторические прогулки','Семейные маршруты'],'Рейтинг 4.9','approved','Публичный рейтинг: 4.9/5.0','СБП • Татарстан'),
  ('10000000-0000-4000-8000-000000000103','anna-petersburg','Анна В.','Собираю культурные и вечерние программы по Санкт-Петербургу и Ленобласти. Маршруты без спешки.',8,array['Санкт-Петербург','Ленобласть','Кронштадт'],array['Русский','Английский'],array['Архитектура','История','Фотопрогулки'],'Рейтинг 5.0','approved','Публичный рейтинг: 5.0/5.0','СБП • Санкт-Петербург'),
  ('10000000-0000-4000-8000-000000000104','maria-sochi','Мария К.','Веду маршруты по Сочи и Красной Поляне с гибким сценарием по погоде.',6,array['Сочи','Красная Поляна','Краснодарский край'],array['Русский','Английский'],array['Природа','Семейные поездки','Город + горы'],'Рейтинг 4.7','approved','Публичный рейтинг: 4.7/5.0','СБП • Краснодарский край'),
  ('10000000-0000-4000-8000-000000000105','alexei-baikal','Алексей С.','Специализируюсь на программах по Байкалу и Иркутской области.',10,array['Байкал','Иркутск','Иркутская область','Ольхон'],array['Русский','Английский','Немецкий'],array['Природные маршруты','Ледовые туры','Фотография'],'Рейтинг 4.9','approved','Публичный рейтинг: 4.9/5.0','СБП • Иркутская область');

-- ---------------------------------------------------------------------------
-- 4. LISTINGS
-- ---------------------------------------------------------------------------
insert into public.listings (id,guide_id,slug,title,region,city,category,route_summary,description,duration_minutes,max_group_size,price_from_minor,currency,private_available,group_available,instant_book,meeting_point,inclusions,exclusions,cancellation_policy_key,status,featured_rank) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000101','elista-steppe-khurul-city-chess','Элиста за день: центр, хурул и Сити-Чесс','Калмыкия','Элиста','Культурно-исторический маршрут','Пагода Семи Дней -> Хурул -> Сити-Чесс -> Степной обзор',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Маршрут подходит для группы')::text,420,8,780000,'RUB',true,true,false,'Элиста, Пагода Семи Дней',array['Услуги гида','Трансфер между локациями'],array['Питание','Личные расходы'],'flexible','published',1),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000102','kazan-kremlin-old-tatar-quarter','Казань: кремль, Старо-Татарская слобода и вечерняя набережная','Татарстан','Казань','Городской маршрут','Казанский кремль -> Слобода -> Озеро Кабан -> Набережная',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Сбалансированный маршрут')::text,360,8,860000,'RUB',true,true,false,'Казань, у башни Сююмбике',array['Услуги гида','Билеты в кремль'],array['Питание','Личные покупки'],'flexible','published',2),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000103','spb-classic-city-and-gulf','Санкт-Петербург: дворцовый центр и выезд к Финскому заливу','Ленобласть','Санкт-Петербург','Культурный маршрут','Невский -> Дворцовая -> Васильевский -> Кронштадт',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1520637836862-4d197d17c55a?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Центр Петербурга и морское направление')::text,510,6,990000,'RUB',true,true,false,'Санкт-Петербург, Гостиный двор',array['Услуги гида','Транспорт в Кронштадт'],array['Музейные билеты','Питание'],'moderate','published',3),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000104','sochi-sea-park-mountain-view','Сочи: морская набережная, парк и обзор Красной Поляны','Краснодарский край','Сочи','Смешанный маршрут','Морпорт -> Ривьера -> Олимпийский парк -> Красная Поляна',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Побережье и горная часть')::text,540,7,1120000,'RUB',true,true,false,'Сочи, Морской вокзал',array['Услуги гида','Транспорт между локациями'],array['Канатная дорога','Питание'],'moderate','published',4),
  ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000105','baikal-irkutsk-listvyanka-olkhon-preview','Байкал: Иркутск, Листвянка и обзорный маршрут к Ольхону','Иркутская область','Иркутск','Природный маршрут','Иркутск -> Листвянка -> Тажеранские степи -> Ольхон',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Длительные переезды и комфортный темп')::text,720,5,1480000,'RUB',true,true,false,'Иркутск, 130-й квартал',array['Услуги гида','Транспорт','Термос с чаем'],array['Паром','Питание','Проживание'],'strict','published',5),
  ('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000102','moscow-historic-center-and-estates','Москва и Подмосковье: центр столицы и усадебный выезд','МО','Москва','Город + загород','Зарядье -> Арбат -> Коломенское -> Архангельское',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Городская прогулка и выезд за МКАД')::text,600,8,1050000,'RUB',true,true,false,'Москва, метро Китай-город',array['Услуги гида','Транспорт между точками'],array['Входные билеты','Питание'],'moderate','published',6),
  ('20000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000002','baikal-olkhon-winter-ice','Байкал зимой: Ольхон, лёд и панорамные точки','Иркутская область','Иркутск','Природный маршрут','Иркутск -> Листвянка -> Ольхон -> Мыс Хобой',jsonb_build_object('imageUrl','https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1600&h=1200&q=80','notes','Зимний маршрут с ночёвкой на Ольхоне')::text,960,6,1680000,'RUB',true,true,false,'Иркутск, 130-й квартал',array['Услуги гида','Транспорт (полный)','Ночёвка на Ольхоне','Термос с чаем'],array['Авиабилеты','Личные расходы'],'moderate','published',1);

-- ---------------------------------------------------------------------------
-- 5. TRAVELER REQUESTS
-- ---------------------------------------------------------------------------
insert into public.traveler_requests (id,traveler_id,destination,region,category,starts_on,ends_on,budget_minor,currency,participants_count,format_preference,notes,open_to_join,allow_guide_suggestions,group_capacity,status) values
  ('30000000-0000-4000-8000-000000000000','00000000-0000-4000-8000-000000000003','Байкал, Иркутская область','Иркутская область','Природный тур',date '2026-07-20',date '2026-07-27',760000,'RUB',2,'Ищу компанию для поездки на Байкал летом',jsonb_build_object('destinationLabel','Байкал, Иркутская область','regionLabel','Иркутская область','imageUrl','https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','20–27 июля','priceScenarios',jsonb_build_array(jsonb_build_object('groupSize',6,'pricePerPersonRub',84000),jsonb_build_object('groupSize',4,'pricePerPersonRub',96000),jsonb_build_object('groupSize',3,'pricePerPersonRub',118000),jsonb_build_object('groupSize',2,'pricePerPersonRub',155000)))::text,true,true,6,'open'),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','Элиста, Калмыкия','Калмыкия','Культурный тур',date '2026-05-10',date '2026-05-16',420000,'RUB',3,'Диапазон дат, гибкий старт ±2 дня',jsonb_build_object('destinationLabel','Элиста, Калмыкия','regionLabel','Калмыкия','imageUrl','https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','вторая половина мая')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000202','Казань, Татарстан','Татарстан','Городская экскурсия',date '2026-06-01',date '2026-06-07',520000,'RUB',2,'Диапазон дат, возможен перенос на неделю',jsonb_build_object('destinationLabel','Казань, Татарстан','regionLabel','Татарстан','imageUrl','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','начало июня')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000203','Санкт-Петербург, Ленобласть','Ленобласть','Культурный тур',date '2026-06-12',date '2026-06-20',680000,'RUB',4,'Период белых ночей',jsonb_build_object('destinationLabel','Санкт-Петербург, Ленобласть','regionLabel','Ленобласть','imageUrl','https://images.unsplash.com/photo-1520637836862-4d197d17c55a?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','середина июня')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000204','Москва, МО','МО','Смешанный тур',date '2026-07-05',date '2026-07-12',600000,'RUB',3,'Диапазон на июль',jsonb_build_object('destinationLabel','Москва, МО','regionLabel','МО','imageUrl','https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','первая половина июля')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000205','Сочи, Краснодарский край','Краснодарский край','Природный тур',date '2026-08-10',date '2026-08-18',740000,'RUB',2,'Период август-сентябрь',jsonb_build_object('destinationLabel','Сочи, Краснодарский край','regionLabel','Краснодарский край','imageUrl','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','август, гибкие даты')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000206','Байкал, Иркутская область','Иркутская область','Природный тур',date '2026-09-01',date '2026-09-12',890000,'RUB',3,'Окно дат по погоде',jsonb_build_object('destinationLabel','Байкал, Иркутская область','regionLabel','Иркутская область','imageUrl','https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','первая половина сентября')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000207','Казань, Татарстан','Татарстан','Гастрономический тур',date '2026-10-01',date '2026-10-08',560000,'RUB',2,'Осенний период',jsonb_build_object('destinationLabel','Казань, Татарстан','regionLabel','Татарстан','imageUrl','https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','начало октября')::text,true,true,8,'open'),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000208','Санкт-Петербург, Ленобласть','Ленобласть','Семейный тур',date '2026-10-15',date '2026-10-25',620000,'RUB',4,'Даты в конце октября',jsonb_build_object('destinationLabel','Санкт-Петербург, Ленобласть','regionLabel','Ленобласть','imageUrl','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&h=1200&q=80','dateRangeLabel','вторая половина октября')::text,true,true,8,'open');

-- ---------------------------------------------------------------------------
-- 6. OPEN REQUEST MEMBERS
-- ---------------------------------------------------------------------------
insert into public.open_request_members (request_id,traveler_id,status,joined_at,left_at) values
  ('30000000-0000-4000-8000-000000000000','00000000-0000-4000-8000-000000000003','joined',timezone('utc',now())-interval '2 day',null),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','joined',timezone('utc',now())-interval '12 day',null),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000202','joined',timezone('utc',now())-interval '11 day',null),
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000203','joined',timezone('utc',now())-interval '9 day',null),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000202','joined',timezone('utc',now())-interval '8 day',null),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000205','joined',timezone('utc',now())-interval '7 day',null),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000203','joined',timezone('utc',now())-interval '10 day',null),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000204','joined',timezone('utc',now())-interval '8 day',null),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000206','joined',timezone('utc',now())-interval '6 day',null),
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000208','joined',timezone('utc',now())-interval '5 day',null),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000204','joined',timezone('utc',now())-interval '6 day',null),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000207','joined',timezone('utc',now())-interval '4 day',null),
  ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000205','joined',timezone('utc',now())-interval '7 day',null),
  ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000201','joined',timezone('utc',now())-interval '3 day',null),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000206','joined',timezone('utc',now())-interval '9 day',null),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000202','joined',timezone('utc',now())-interval '8 day',null),
  ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000203','joined',timezone('utc',now())-interval '7 day',null),
  ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000207','joined',timezone('utc',now())-interval '5 day',null),
  ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000208','joined',timezone('utc',now())-interval '4 day',null),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000208','joined',timezone('utc',now())-interval '4 day',null),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000201','joined',timezone('utc',now())-interval '3 day',null),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000205','joined',timezone('utc',now())-interval '2 day',null),
  ('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000206','joined',timezone('utc',now())-interval '1 day',null);

-- ---------------------------------------------------------------------------
-- 7. GUIDE OFFERS
-- ---------------------------------------------------------------------------
insert into public.guide_offers (id,request_id,guide_id,listing_id,title,message,price_minor,currency,capacity,starts_at,ends_at,inclusions,expires_at,status) values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000000','00000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000007','Байкал зимой: Ольхон, лёд и панорамные точки','Предлагаю авторский маршрут с ночёвкой на Ольхоне.',960000,'RUB',6,'2026-07-20 08:00+00','2026-07-24 20:00+00',array['Транспорт','Гид','Ночёвка на Ольхоне'],timezone('utc',now())+interval '14 day','pending'),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000007','Байкал в сентябре: групповой маршрут','Сентябрь — лучшее время для Байкала.',890000,'RUB',5,'2026-09-01 08:00+00','2026-09-08 20:00+00',array['Транспорт','Гид','Термос с чаем'],timezone('utc',now())+interval '21 day','pending'),
  ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000002','Казань: кремль, слобода и вечерняя набережная','Стандартный маршрут по лучшим точкам Казани.',520000,'RUB',8,'2026-06-01 09:00+00','2026-06-04 19:00+00',array['Гид','Билеты в кремль'],timezone('utc',now())+interval '10 day','pending');

-- ---------------------------------------------------------------------------
-- 8. BOOKINGS
-- ---------------------------------------------------------------------------
insert into public.bookings (id,traveler_id,guide_id,request_id,offer_id,listing_id,status,party_size,starts_at,ends_at,subtotal_minor,deposit_minor,remainder_minor,currency,cancellation_policy_snapshot,meeting_point) values
  ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','10000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000001',null,'20000000-0000-4000-8000-000000000001','completed',3,'2026-05-10 09:00+00','2026-05-14 19:00+00',780000,234000,0,'RUB','{"policy":"flexible","description":"Бесплатная отмена за 7 дней"}','Элиста, Пагода Семи Дней'),
  ('60000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000000','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000007','confirmed',2,'2026-07-20 08:00+00','2026-07-24 20:00+00',960000,288000,672000,'RUB','{"policy":"moderate","description":"Отмена за 14 дней — возврат депозита 50%"}','Иркутск, 130-й квартал');

-- ---------------------------------------------------------------------------
-- 9. REVIEWS
-- ---------------------------------------------------------------------------
insert into public.reviews (id,booking_id,traveler_id,guide_id,listing_id,rating,title,body,status) values
  ('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000201','10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001',5,'Лучший маршрут по Калмыкии','Баир отлично организовал программу — темп спокойный, всё объяснял по дороге. Рекомендую.','published');

-- ---------------------------------------------------------------------------
-- 10. FAVORITES
-- ---------------------------------------------------------------------------
insert into public.favorites (id,user_id,subject,listing_id,guide_id) values
  ('80000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','listing','20000000-0000-4000-8000-000000000005',null),
  ('80000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','guide',null,'00000000-0000-4000-8000-000000000002');

-- ---------------------------------------------------------------------------
-- 11. QUALITY SNAPSHOTS (skipped if table doesn't exist yet — run migration first)
-- ---------------------------------------------------------------------------
do $$ begin
insert into public.quality_snapshots (subject_type,subject_slug,tier,response_time_hours,completion_rate,rating_avg,review_count) values
  ('guide','alexei-sokolov','gold',2.5,0.98,4.9,42),
  ('guide','bair-elista','gold',3.0,0.95,4.8,28),
  ('guide','timur-kazan','silver',4.5,0.92,4.9,35),
  ('guide','anna-petersburg','gold',2.0,0.97,5.0,51),
  ('guide','maria-sochi','silver',5.0,0.90,4.7,19),
  ('guide','alexei-baikal','gold',2.8,0.96,4.9,38),
  ('listing','elista-steppe-khurul-city-chess','silver',null,null,4.8,12),
  ('listing','kazan-kremlin-old-tatar-quarter','gold',null,null,4.9,24),
  ('listing','spb-classic-city-and-gulf','gold',null,null,5.0,18),
  ('listing','sochi-sea-park-mountain-view','silver',null,null,4.7,9),
  ('listing','baikal-irkutsk-listvyanka-olkhon-preview','gold',null,null,4.9,31),
  ('listing','moscow-historic-center-and-estates','silver',null,null,4.8,15),
  ('listing','baikal-olkhon-winter-ice','gold',null,null,4.9,22);
exception when undefined_table then null;
end $$;

-- ---------------------------------------------------------------------------
-- 12. DESTINATIONS (via marketplace_events)
-- ---------------------------------------------------------------------------
insert into public.marketplace_events (id,scope,request_id,booking_id,dispute_id,actor_id,event_type,summary,detail,payload,created_at) values
  ('50000000-0000-4000-8000-000000000001','moderation',null,null,null,null,'destination_seed','Элиста, Калмыкия','Каталог направления',jsonb_build_object('slug','elista-kalmykia','name','Элиста','region','Калмыкия','imageUrl','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80','description','Буддийская культура, степные пейзажи и спокойный темп.'),timezone('utc',now())),
  ('50000000-0000-4000-8000-000000000002','moderation',null,null,null,null,'destination_seed','Казань, Татарстан','Каталог направления',jsonb_build_object('slug','kazan-tatarstan','name','Казань','region','Татарстан','imageUrl','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80','description','Городские маршруты с историей и гастрономией.'),timezone('utc',now())),
  ('50000000-0000-4000-8000-000000000003','moderation',null,null,null,null,'destination_seed','Санкт-Петербург, Ленобласть','Каталог направления',jsonb_build_object('slug','saint-petersburg-leningrad-oblast','name','Санкт-Петербург','region','Ленобласть','imageUrl','https://images.unsplash.com/photo-1520637836862-4d197d17c55a?auto=format&fit=crop&w=1600&h=1200&q=80','description','Культурные и загородные маршруты.'),timezone('utc',now())),
  ('50000000-0000-4000-8000-000000000004','moderation',null,null,null,null,'destination_seed','Москва, МО','Каталог направления',jsonb_build_object('slug','moscow-moscow-oblast','name','Москва','region','МО','imageUrl','https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80','description','Городские и выездные форматы.'),timezone('utc',now())),
  ('50000000-0000-4000-8000-000000000005','moderation',null,null,null,null,'destination_seed','Сочи, Краснодарский край','Каталог направления',jsonb_build_object('slug','sochi-krasnodar-krai','name','Сочи','region','Краснодарский край','imageUrl','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=1200&q=80','description','Море, горные локации и активные маршруты.'),timezone('utc',now())),
  ('50000000-0000-4000-8000-000000000006','moderation',null,null,null,null,'destination_seed','Байкал, Иркутская область','Каталог направления',jsonb_build_object('slug','baikal-irkutsk-oblast','name','Байкал','region','Иркутская область','imageUrl','https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80','description','Природные маршруты и фотопоездки.'),timezone('utc',now()));
