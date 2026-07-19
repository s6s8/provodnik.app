-- Item 2 — ready-tour price is per group, not per person.
--
-- Ready tours (готовые экскурсии) live in guide_templates. Historically the price
-- (price_from_kopecks) was authored under «Цена от (₽) · за человека» — per person.
-- The product now authors a concrete «Цена за группу». We must NOT silently
-- reinterpret legacy amounts, so we pin each record's meaning with an explicit scope:
--   per_person → the legacy amount is per traveler (unchanged public output: «за одного»)
--   per_group  → the amount covers the whole group (public output: «за группу до N человек»)
--
-- Existing rows default to per_person: no reinterpretation, no financial meaning loss.
-- New tours are written per_group by the authoring path.
ALTER TABLE public.guide_templates
  ADD COLUMN IF NOT EXISTS price_scope text NOT NULL DEFAULT 'per_person';

ALTER TABLE public.guide_templates
  DROP CONSTRAINT IF EXISTS guide_templates_price_scope_check;
ALTER TABLE public.guide_templates
  ADD CONSTRAINT guide_templates_price_scope_check
  CHECK (price_scope IN ('per_person', 'per_group'));

COMMENT ON COLUMN public.guide_templates.price_scope IS
  'per_person = legacy amount is per traveler; per_group = amount covers the whole group. New ready tours are per_group.';
