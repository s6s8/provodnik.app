-- Add region and category to guide_templates for catalog filtering
alter table guide_templates
  add column if not exists region text,
  add column if not exists category text;
