-- =============================================================================
-- Finish-website Task 1 — richer demo seed data (ADDITIVE, idempotent)
--
-- Purpose: make the app feel alive across search, messages, bookings, reviews,
-- admin queues and favorites, attributed to existing seeded demo/seed users so
-- RLS-scoped pages render real data.
--
-- All rows use fixed PKs + `on conflict do nothing/update`. Safe to re-run.
-- Ratings (listings.average_rating/review_count, guide_profiles.*) are NOT set
-- here — the `tg_refresh_rating_on_review` AFTER trigger maintains them on
-- review insert.
--
-- Reference users (from 20260401000002_seed.sql):
--   demo admin    00000000-0000-4000-8000-000000000001
--   demo guide    00000000-0000-4000-8000-000000000002 (alexei-sokolov, approved)
--   demo traveler 00000000-0000-4000-8000-000000000003
--   guides 101..105 (approved), travelers 201..208 (SeedPass1!)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. exp_type / format coverage — spread the 8 published listings across the
--    FilterBar experience types so /search type pills + /destinations counts
--    are non-zero. (Today every published row has exp_type = NULL.)
-- ---------------------------------------------------------------------------
update public.listings set exp_type = 'excursion',    format = coalesce(format,'group')   where id = '20000000-0000-4000-8000-000000000001';
update public.listings set exp_type = 'masterclass',  format = coalesce(format,'group')   where id = '20000000-0000-4000-8000-000000000002';
update public.listings set exp_type = 'photosession', format = coalesce(format,'private') where id = '20000000-0000-4000-8000-000000000003';
update public.listings set exp_type = 'quest',        format = coalesce(format,'group')   where id = '20000000-0000-4000-8000-000000000004';
update public.listings set exp_type = 'activity',     format = coalesce(format,'group')   where id = '20000000-0000-4000-8000-000000000005';
update public.listings set exp_type = 'tour',         format = coalesce(format,'private') where id = '20000000-0000-4000-8000-000000000006';
update public.listings set exp_type = 'excursion',    format = coalesce(format,'private') where id = '20000000-0000-4000-8000-000000000009';
update public.listings set exp_type = 'photosession', format = coalesce(format,'group')   where id = '20000000-0000-4000-8000-000000000010';

-- ---------------------------------------------------------------------------
-- 2. Four new published listings to cover the remaining exp_types (waterwalk,
--    transfer) + add catalog volume. Owned by approved+available guides.
-- ---------------------------------------------------------------------------
insert into public.listings
  (id, guide_id, slug, title, region, city, category, exp_type, format,
   description, duration_minutes, max_group_size, price_from_minor, currency,
   status, image_url, private_available, group_available, instant_book,
   meeting_point, featured_rank)
values
  ('a0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',
   'spb-neva-evening-boat-walk','Санкт-Петербург: вечерняя прогулка по Неве и каналам',
   'Санкт-Петербург','Санкт-Петербург','Водная прогулка','waterwalk','group',
   'Неспешный вечерний маршрут по воде с видами на разводные мосты и набережные.',
   90, 12, 250000, 'RUB', 'published',
   'https://images.unsplash.com/photo-1556610961-2f64217e5a40', true, true, false,
   'Причал у Эрмитажа', 9),
  ('a0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002',
   'sochi-airport-transfer-comfort','Сочи: комфортный трансфер из аэропорта к отелю',
   'Краснодарский край','Сочи','Трансфер','transfer','private',
   'Встреча с табличкой, помощь с багажом и прямой трансфер до места размещения.',
   60, 4, 350000, 'RUB', 'published',
   'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d', true, false, true,
   'Зал прилёта аэропорта Сочи', 10),
  ('a0000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000102',
   'kazan-quest-old-tatar-quarter','Казань: городской квест по Старо-Татарской слободе',
   'Татарстан','Казань','Квест','quest','group',
   'Командный маршрут с загадками по историческому кварталу — для компаний и семей.',
   120, 8, 180000, 'RUB', 'published',
   'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a', true, true, false,
   'Площадь у озера Кабан', 11),
  ('a0000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000105',
   'baikal-winter-ice-activity-day','Байкал: активный день на льду — коньки, хивус и горячий чай',
   'Иркутская область','Листвянка','Активный отдых','activity','group',
   'Зимний активный маршрут по льду Байкала с прогулкой на хивусе и видовыми точками.',
   300, 10, 650000, 'RUB', 'published',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba', true, true, false,
   'Причал Листвянки', 12)
on conflict (id) do update set
  exp_type = excluded.exp_type, format = excluded.format, status = excluded.status,
  image_url = excluded.image_url, updated_at = now();

-- ---------------------------------------------------------------------------
-- 3. Bookings in multiple statuses (variety for /trips, /guide/bookings,
--    /admin/bookings). Completed bookings back the reviews in section 4.
-- ---------------------------------------------------------------------------
insert into public.bookings
  (id, traveler_id, guide_id, listing_id, status, party_size, starts_at, ends_at,
   subtotal_minor, deposit_minor, remainder_minor, currency, meeting_point)
values
  -- demo traveler ↔ demo guide
  ('61000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000002','pending',   2, now() + interval '8 days',  now() + interval '8 days'  + interval '3 hours', 360000, 0, 360000, 'RUB','Казань, кремль'),
  ('61000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','completed', 2, now() - interval '14 days', now() - interval '14 days' + interval '90 minutes', 500000, 0, 500000, 'RUB','Причал у Эрмитажа'),
  ('61000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000003','cancelled', 3, now() - interval '5 days',  now() - interval '5 days'  + interval '3 hours', 540000, 0, 540000, 'RUB','Дворцовая площадь'),
  -- seed travelers (populate guide review pages + dispute queue)
  ('61000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000202','10000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000002','disputed',  2, now() - interval '20 days', now() - interval '20 days' + interval '3 hours', 360000, 0, 360000, 'RUB','Казань, кремль'),
  ('61000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000203','10000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000003','completed', 2, now() - interval '25 days', now() - interval '25 days' + interval '3 hours', 360000, 0, 360000, 'RUB','Дворцовая площадь'),
  ('62000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000204','10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001','completed', 1, now() - interval '30 days', now() - interval '30 days' + interval '4 hours', 280000, 0, 280000, 'RUB','Чистые пруды'),
  ('62000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000205','10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001','completed', 2, now() - interval '40 days', now() - interval '40 days' + interval '4 hours', 560000, 0, 560000, 'RUB','Чистые пруды'),
  ('62000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000206','10000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000002','disputed',  4, now() - interval '12 days', now() - interval '12 days' + interval '3 hours', 720000, 0, 720000, 'RUB','Казань, кремль')
on conflict (id) do update set status = excluded.status, updated_at = now();

-- ---------------------------------------------------------------------------
-- 4. Reviews on completed bookings (populate /guide/reviews + listing ratings
--    via the rating-refresh trigger). One booking → at most one review (unique).
--    Listing 001 ends up with 3 reviews (1 existing + 2 here) = "popular".
-- ---------------------------------------------------------------------------
insert into public.reviews
  (id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, status, would_recommend)
values
  ('71000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001',5,'Прекрасный вечер на воде','Маршрут спокойный, виды потрясающие, гид очень внимательный. Рекомендую!','published',true),
  ('71000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000203','10000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000003',4,'Душевная прогулка по центру','Узнали много нового про парадный Петербург. Немного устали, но впечатления отличные.','published',true),
  ('71000000-0000-4000-8000-000000000003','62000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000204','10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001',5,'Москва с другой стороны','Тихие дворы и переулки, о которых сам бы никогда не узнал. Огонь!','published',true),
  ('71000000-0000-4000-8000-000000000004','62000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000205','10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001',4,'Хороший неспешный маршрут','Понравился темп и истории. Местами хотелось чуть больше времени на фото.','published',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Conversation threads + participants + messages (populate /messages and the
--    guide inbox). getUserThreads reads via thread_participants.
-- ---------------------------------------------------------------------------
insert into public.conversation_threads (id, subject_type, offer_id, booking_id, created_by)
values
  -- demo traveler ↔ demo guide, around the pending offer 40..001
  ('e0000000-0000-4000-8000-000000000001','offer',  '40000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-000000000003'),
  -- demo traveler ↔ demo guide, around the confirmed booking 60..002
  ('e0000000-0000-4000-8000-000000000002','booking', null,'60000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'),
  -- seed traveler 202 ↔ guide 102, around offer 40..003
  ('e0000000-0000-4000-8000-000000000003','offer',  '40000000-0000-4000-8000-000000000003', null, '10000000-0000-4000-8000-000000000202')
on conflict (id) do nothing;

insert into public.thread_participants (thread_id, user_id) values
  ('e0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003'),
  ('e0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'),
  ('e0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000202'),
  ('e0000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000102')
on conflict (thread_id, user_id) do nothing;

insert into public.messages (id, thread_id, sender_id, sender_role, body, created_at) values
  ('e1000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','traveler','Здравствуйте! Подскажите, маршрут подойдёт для поездки с подростком?', now() - interval '3 days'),
  ('e1000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','guide','Добрый день! Да, конечно — темп спокойный, будет интересно и взрослым, и подросткам.', now() - interval '3 days' + interval '20 minutes'),
  ('e1000000-0000-4000-8000-000000000003','e0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','traveler','Отлично, тогда думаю над датами. Спасибо за быстрый ответ!', now() - interval '3 days' + interval '35 minutes'),
  ('e1000000-0000-4000-8000-000000000004','e0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','guide','Бронирование подтверждено. Встречаемся за 10 минут до начала у точки сбора.', now() - interval '2 days'),
  ('e1000000-0000-4000-8000-000000000005','e0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','traveler','Принято, будем вовремя. До встречи!', now() - interval '2 days' + interval '15 minutes'),
  ('e1000000-0000-4000-8000-000000000006','e0000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000102','guide','Здравствуйте! Готов предложить маршрут под ваш запрос по Казани. Какие даты удобны?', now() - interval '1 day'),
  ('e1000000-0000-4000-8000-000000000007','e0000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000202','traveler','Здравствуйте! Рассматриваем выходные в конце месяца. Что входит в стоимость?', now() - interval '1 day' + interval '40 minutes')
on conflict (id) do nothing;

-- mark demo guide's view of the booking thread as read so the traveler's reply
-- shows as unread for the guide-side demo (nice non-empty unread badge)
update public.thread_participants
  set last_read_at = now() - interval '2 days' + interval '5 minutes'
  where thread_id = 'e0000000-0000-4000-8000-000000000002'
    and user_id = '00000000-0000-4000-8000-000000000002';

-- ---------------------------------------------------------------------------
-- 6. Disputes + events (populate /admin/disputes). Bookings 6100..004 and
--    6200..003 are seeded with status='disputed' above.
-- ---------------------------------------------------------------------------
insert into public.disputes
  (id, booking_id, opened_by, assigned_admin_id, status, reason, summary, requested_outcome, payout_frozen)
values
  ('e3000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000202', null, 'open','Экскурсия началась позже','Гид опоздал на 40 минут, часть маршрута пропустили.','Частичный возврат', true),
  ('e3000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000001','under_review','Не совпало описание','Программа отличалась от заявленной на странице.','Повторная экскурсия или возврат', true)
on conflict (id) do nothing;

insert into public.dispute_events (id, dispute_id, actor_id, event_type, payload) values
  ('e4000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000202','opened','{"note":"Открыт спор путешественником"}'),
  ('e4000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000206','opened','{"note":"Открыт спор путешественником"}'),
  ('e4000000-0000-4000-8000-000000000003','e3000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','assigned','{"note":"Назначен администратор, статус под рассмотрением"}')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Moderation queue (populate /admin/moderation). One case per subject_type.
-- ---------------------------------------------------------------------------
insert into public.moderation_cases
  (id, subject_type, guide_id, listing_id, review_id, opened_by, status, queue_reason, risk_flags)
values
  ('e2000000-0000-4000-8000-000000000001','listing', null,'20000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000001','open','Жалоба на содержание описания', '{"complaint"}'),
  ('e2000000-0000-4000-8000-000000000002','review',  null, null,'71000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','open','Подозрение на накрутку отзывов', '{"spam","velocity"}'),
  ('e2000000-0000-4000-8000-000000000003','guide_profile','10000000-0000-4000-8000-000000000104', null, null,'00000000-0000-4000-8000-000000000001','open','Документы гида на проверке', '{"kyc"}')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 8. Favorites folders + items (FEATURE_TR_FAVORITES). The base `favorites`
--    table already has rows; folders/items were empty.
-- ---------------------------------------------------------------------------
insert into public.favorites_folders (id, user_id, name, position) values
  ('e5000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','Хочу посетить', 0),
  ('e5000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','Москва на выходные', 1)
on conflict (id) do nothing;

insert into public.favorites_items (folder_id, listing_id) values
  ('e5000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'),
  ('e5000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003'),
  ('e5000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000005'),
  ('e5000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001'),
  ('e5000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001'),
  ('e5000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000009')
on conflict (folder_id, listing_id) do nothing;

-- ---------------------------------------------------------------------------
-- 9. Referral code (FEATURE_TR_REFERRALS) so /referrals isn't empty when demoed.
-- ---------------------------------------------------------------------------
insert into public.referral_codes (id, user_id, code) values
  ('e6000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','DEMO-PROVODNIK')
on conflict (id) do nothing;
