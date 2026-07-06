/goal FIX open-tasks 06.07.26. Ledger=docs/qa/open-tasks-20260706/LEDGER.md.

MUTATE: 1st run copy this→GOAL.md same dir; it IS the goal, re-read every cycle; reorder/split/add rows, refine when runtime disproves hints. IMMUTABLE: GATES+STOP+this block; mutations only add rigor/redirect. Log in ##MUTATION LOG, commit.

STEP0: a) deploy base of vps.provodnik.app? account_status+/admin/users only on main; partial #35 fix on unmerged fa525a94. b) #35/#38 base=main; others verify file on base. c) read-only SQL drift probe vs migrations (columns/buckets/policies).

#35 P0 SEC(main): suspend=cosmetic, sessions valid; actions+write RLS+3 SECURITY DEFINER RPCs skip status. Fix: 1) auth.admin.updateUserById({ban_duration}) on suspend, clear on reactivate, verify vs JWT TTL; 2) profile_account_status_for(auth.uid())='active' on write policies+RPCs (targeted SQL+ledger repair, NEVER db push); 3) integrate fa525a94. Test: suspended can't create/accept.
#38 P0(main): unmask admin contacts, admin-users.ts:302-303,:194-195; KEEP :242 audit mask; note PII-012 scope.
#40 P1 inbox banner: setLoadError guide-requests-inbox-screen.tsx:94,106,115,129 never cleared+refires; makeError core.ts:165 drops PG msg, returns Error over action boundary (unserializable). DevTools 1st: 400 guide_profiles|guide_offers=drift; rejected POST=serialization. Fix: per-source errors, clear-on-retry, {code,message}, log.
#39 P1 avatar→initials. 1st: upload, select avatar_url: null=silent 0-row UPDATE (avatar-action.ts:87-94 no .select()); else curl -I url (403/404=bucket drift). Fix: .select("id") 0rows=fail; un-swallow catches :97-103 + account/page.tsx:109-111, log.
#34 P1 relogin on НАЙТИ ГИДА: use-request-form.ts:101-116 browser getUser() pre-check, any throw→gate; race w/ proxy.ts:67-74. Fix: DELETE pre-check; createRequestAction returns auth_required code, gate only on it.
#37 P1 signup crit error, NOT ERR-029: no root error.tsx; server-auth.ts:74-77 no try/catch, getUser throw in layout SSR=fatal. Fix: degrade to unauthenticatedContext; add root error.tsx; catch homepage-auth-gate.tsx:82-115. Sentry digest 1st.
#24 P1 initials≠photo=RLS: avatar via profiles embed queries.ts:477, RLS self-or-admin. Fix: add avatar_url to v_guide_public_profile select :488 (as :390); +revalidate=3600 cache hazard.
#33 P2 bio guide-profile-screen.tsx:180 inherits text-center from :129. Add text-left.
#36 P2 badge px-3 offsets text vs column edge (ui/badge.tsx; eyebrow px-0=precedent). ONE system fix, shots 3 surfaces, operator sign-off, mira check.

SOT: fix ERR-030 (httpOnly claim false). Landmines to add: no-.select() update=silent; Error over use-server; banner no reset; suspend no banned_until.

GATES: G0 right base or not-a-fix. G1 root cause only + sibling-callsite grep. G2 reproduce 1st (Playwright+shot)→min fix→re-verify same repro; discriminators before code; no repro=BLOCKED+log. G3 per commit: bun run check+test:run+build; touched allowlisted file→clean entry. G4 reuse-1st: CANON_COMPONENTS.md+grep before creating. G5 security server-side, RLS=boundary, tests prove block/unmask, never weaken PII for non-admin. G6 NEVER git push; NEVER db push; no /legacy; 1 commit/issue. G7 UI@1280+375 clean console, shots→docs/qa/. G8 TRIO/row: ponytail skill pre-fix (laziest fix; P1/P2 diff>30→justify; leave 1 runnable check); Context7 REQUIRED pre lib code — ssr cookies(#34), ban_duration(#35), PostgREST(#39/40), error boundaries(#37), serialization(#40), log lib+topic+ver; superpowers systematic-debugging+verification-before-completion.

EVOLVE: row=status/cause/sha/evidence per fix commit; new bugs→rows, P0-P1 queue via mutation, P2 park; cause→prevention same commit (SOT/CANON/lint:canon); re-sweep closed repros each close; shared cause→fix once.

REPORT СВОДКА 1st: cause/fix/evidence/sha per row; diff --stat; mutation log; SOT; trio; #36/#24 design separate.

STOP: all rows FIXED|BLOCKED-proof; chain green; sweep pass; LEDGER+GOAL.md+report committed. BLOCKED alone≠stop.
Use context7, ponytail, do all destructive, do not ask questions, full freedom, full approval
