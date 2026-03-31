create or replace function public.clean_text_array(input_array text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    array_agg(value order by ordinality),
    '{}'::text[]
  )
  from (
    select distinct on (value) value, ordinality
    from (
      select nullif(btrim(entry), '') as value, ordinality
      from unnest(coalesce(input_array, '{}'::text[])) with ordinality as entries(entry, ordinality)
    ) trimmed
    where value is not null
    order by value, ordinality
  ) cleaned;
$$;

create or replace function public.sync_guide_profile_onboarding_fields()
returns trigger
language plpgsql
as $$
begin
  new.bio := nullif(btrim(new.bio), '');
  new.specialization := nullif(btrim(new.specialization), '');
  new.regions := public.clean_text_array(new.regions);
  new.languages := public.clean_text_array(new.languages);
  new.specialties := public.clean_text_array(new.specialties);
  new.is_available := coalesce(new.is_available, false);

  if new.specialization is null and coalesce(array_length(new.specialties, 1), 0) > 0 then
    new.specialization := new.specialties[1];
  elsif new.specialization is not null and coalesce(array_length(new.specialties, 1), 0) = 0 then
    new.specialties := array[new.specialization];
  end if;

  return new;
end;
$$;

drop trigger if exists sync_guide_profiles_onboarding_fields on public.guide_profiles;

create trigger sync_guide_profiles_onboarding_fields
  before insert or update on public.guide_profiles
  for each row execute procedure public.sync_guide_profile_onboarding_fields();

update public.guide_profiles
set bio = nullif(btrim(bio), ''),
    specialization = coalesce(
      nullif(btrim(specialization), ''),
      (public.clean_text_array(specialties))[1]
    ),
    specialties = case
      when coalesce(array_length(public.clean_text_array(specialties), 1), 0) = 0
        and nullif(btrim(specialization), '') is not null
        then array[nullif(btrim(specialization), '')]
      else public.clean_text_array(specialties)
    end,
    regions = public.clean_text_array(regions),
    languages = public.clean_text_array(languages),
    is_available = coalesce(is_available, false);

create or replace function public.user_has_role(target_user_id uuid, expected_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = target_user_id
        and p.role = expected_role
    );
$$;

create or replace function public.can_access_request_thread(target_request_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.traveler_requests tr
      where tr.id = target_request_id
        and (
          tr.traveler_id = target_user_id
          or public.user_has_role(target_user_id, 'guide'::public.app_role)
          or public.user_has_role(target_user_id, 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_offer_thread(target_offer_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.guide_offers go
      join public.traveler_requests tr on tr.id = go.request_id
      where go.id = target_offer_id
        and (
          go.guide_id = target_user_id
          or tr.traveler_id = target_user_id
          or public.user_has_role(target_user_id, 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_booking_thread(target_booking_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.bookings b
      where b.id = target_booking_id
        and (
          b.traveler_id = target_user_id
          or b.guide_id = target_user_id
          or public.user_has_role(target_user_id, 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_dispute_thread(target_dispute_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = target_dispute_id
        and (
          d.opened_by = target_user_id
          or d.assigned_admin_id = target_user_id
          or b.traveler_id = target_user_id
          or b.guide_id = target_user_id
          or public.user_has_role(target_user_id, 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_conversation_thread(target_thread_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.conversation_threads ct
      where ct.id = target_thread_id
        and (
          ct.created_by = target_user_id
          or case ct.subject_type
            when 'request' then public.can_access_request_thread(ct.request_id, target_user_id)
            when 'offer' then public.can_access_offer_thread(ct.offer_id, target_user_id)
            when 'booking' then public.can_access_booking_thread(ct.booking_id, target_user_id)
            when 'dispute' then public.can_access_dispute_thread(ct.dispute_id, target_user_id)
            else false
          end
        )
    );
$$;

create or replace function public.can_create_conversation_thread(
  target_subject_type public.thread_subject,
  target_request_id uuid,
  target_offer_id uuid,
  target_booking_id uuid,
  target_dispute_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id is not null
    and case target_subject_type
      when 'request' then public.can_access_request_thread(target_request_id, target_user_id)
      when 'offer' then public.can_access_offer_thread(target_offer_id, target_user_id)
      when 'booking' then public.can_access_booking_thread(target_booking_id, target_user_id)
      when 'dispute' then public.can_access_dispute_thread(target_dispute_id, target_user_id)
      else false
    end;
$$;

drop policy if exists "guide_profiles_public_read_published" on public.guide_profiles;
create policy "guide_profiles_public_read_published"
  on public.guide_profiles for select
  using (
    verification_status = 'approved'
    or (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "guide_profiles_insert_owner_or_admin" on public.guide_profiles;
create policy "guide_profiles_insert_owner_or_admin"
  on public.guide_profiles for insert
  with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "guide_profiles_update_owner_or_admin" on public.guide_profiles;
create policy "guide_profiles_update_owner_or_admin"
  on public.guide_profiles for update
  using (
    (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "conversation_threads_select_participant_or_admin" on public.conversation_threads;
create policy "conversation_threads_select_participant_or_admin"
  on public.conversation_threads for select
  using (public.can_access_conversation_thread(id));

drop policy if exists "conversation_threads_insert_related_or_admin" on public.conversation_threads;
create policy "conversation_threads_insert_related_or_admin"
  on public.conversation_threads for insert
  with check (
    (
      auth.uid() is not null
      and created_by = auth.uid()
      and public.can_create_conversation_thread(
        subject_type,
        request_id,
        offer_id,
        booking_id,
        dispute_id,
        auth.uid()
      )
    )
    or public.is_admin()
  );

drop policy if exists "thread_participants_select_self_or_admin" on public.thread_participants;
create policy "thread_participants_select_self_or_admin"
  on public.thread_participants for select
  using (public.can_access_conversation_thread(thread_id));

drop policy if exists "thread_participants_insert_admin_only" on public.thread_participants;
create policy "thread_participants_insert_admin_only"
  on public.thread_participants for insert
  with check (
    public.is_admin()
    or (
      auth.uid() is not null
      and public.can_access_conversation_thread(thread_id, auth.uid())
      and public.can_access_conversation_thread(thread_id, user_id)
    )
  );

drop policy if exists "thread_participants_update_self_or_admin" on public.thread_participants;
create policy "thread_participants_update_self_or_admin"
  on public.thread_participants for update
  using (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "messages_select_participant_or_admin" on public.messages;
create policy "messages_select_participant_or_admin"
  on public.messages for select
  using (public.can_access_conversation_thread(thread_id));

drop policy if exists "messages_insert_participant_or_admin" on public.messages;
create policy "messages_insert_participant_or_admin"
  on public.messages for insert
  with check (
    (
      auth.uid() is not null
      and public.can_access_conversation_thread(thread_id, auth.uid())
      and (sender_id is null or sender_id = auth.uid())
    )
    or public.is_admin()
  );
