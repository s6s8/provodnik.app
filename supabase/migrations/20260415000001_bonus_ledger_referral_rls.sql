-- Allow authenticated users to insert bonus_ledger rows created by referral redemption
-- (redeemer credits self + referrer), after referral_redemptions row exists.
DROP POLICY IF EXISTS "bonus_ledger_insert" ON public.bonus_ledger;
CREATE POLICY "bonus_ledger_insert" ON public.bonus_ledger FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      (SELECT auth.uid()) = user_id
      AND reason = 'referral_redeemed'
      AND ref_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.referral_redemptions rr
        WHERE rr.code_id = ref_id AND rr.redeemed_by = (SELECT auth.uid())
      )
    )
    OR (
      reason = 'referral_used'
      AND ref_id IS NOT NULL
      AND (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.referral_codes rc
        WHERE rc.id = ref_id AND rc.user_id = user_id
      )
      AND EXISTS (
        SELECT 1 FROM public.referral_redemptions rr
        WHERE rr.code_id = ref_id AND rr.redeemed_by = (SELECT auth.uid())
      )
    )
  );
