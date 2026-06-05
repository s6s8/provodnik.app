-- Расширяем guide_templates до единой модели шаблона/экскурсии

alter table guide_templates
  add column if not exists meeting_point text,
  add column if not exists max_participants integer,
  add column if not exists photo_urls text[] not null default '{}',
  add column if not exists status text not null default 'draft';

alter table guide_templates
  add constraint guide_templates_status_check
  check (status in ('draft', 'published'));

-- Убираем старые поля: is_visible заменяет status, sort_order не нужен
alter table guide_templates
  drop column if exists is_visible,
  drop column if exists sort_order;

-- Публичный SELECT для опубликованных шаблонов (для будущего каталога)
create policy "guide_templates_select_published"
  on guide_templates for select
  using (status = 'published');
