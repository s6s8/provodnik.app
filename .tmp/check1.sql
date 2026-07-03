select verification_status, is_available, (slug is not null and slug <> '') as has_slug, count(*) from public.guide_profiles group by 1,2,3 order by 1;
