# 01 funnel-events (cursorSDK; DB: events table via mini)
GOAL: lightweight funnel instrumentation so Phase-1 impact is measurable on the thin user base.
EVENTS: request_created, bid_placed, offer_accepted, contact_revealed.
DB: create an additive `analytics_events` table (id, event text, user_id nullable, ref_id, props jsonb, created_at) + RLS insert policy for authenticated/anon-as-appropriate; apply AUTONOMOUSLY via mini; live-verify insert+select.
CODE: a tiny `track(event, props)` server helper + call it at the 4 lifecycle points (createRequestAction, submitOfferAction, acceptOfferAction, contact-reveal path). No PII in props.
VERIFY: typecheck/lint/test/build; live — performing each action inserts a row.
COMMIT: `feat(analytics): lightweight funnel events (request/bid/accept/reveal)`

