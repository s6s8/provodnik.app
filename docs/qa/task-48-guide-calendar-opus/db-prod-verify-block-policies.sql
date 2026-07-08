select count(*) as block_policy_count,
       bool_or(policyname='guide_availability_blocks_select') as has_select,
       bool_or(policyname='guide_availability_blocks_insert') as has_insert,
       bool_or(policyname='guide_availability_blocks_update') as has_update,
       bool_or(policyname='guide_availability_blocks_delete') as has_delete,
       bool_and(qual like '%is_admin%' or with_check like '%is_admin%' or policyname is not null) as policies_present
from pg_policies
where schemaname='public' and tablename='guide_availability_blocks';
