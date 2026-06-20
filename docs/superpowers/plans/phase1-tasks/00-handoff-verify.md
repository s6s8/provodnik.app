# 00 handoff-verify (orchestrator; cursorSDK only if gaps found)
GOAL: confirm the booking handoff works end-to-end live before any spine work.
DO: Sonnet browser subagent walks request→bid→accept→contact-revealed→booking on prod (demo accounts, pass Provodnik-QA-2026!). Much was fixed in PR #129; verify identity/contact reveal post-accept, the accept→confirm step (no 404), guide booking-detail/confirm.
IF GAPS: compose a cursorSDK prompt to fix the specific broken step (≤5 files), gate + Sonnet-verify + merge. If a DB fix is needed, apply via mini.
VERIFY: Sonnet browser PASS of the full chain @1280/375.
DONE-MARK when chain verified (and any gap fixed+merged).

