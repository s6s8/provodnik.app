# 24 home (V-7 + R-6 + R-8) — cursorSDK
SCOPE: canon-align the conversational home; keep one-job chat form.
FILES: src/features/homepage/components/hero-conversation.tsx.
WHAT: replace inline gradient style={} with token utilities/bg-glass; add an above-the-fold trust line + "обычно гиды отвечают за ~N ч" expectation; scope-questions-first stays; 375px above-fold shows heading+input+enabled-on-input CTA. (link already fixed in task 15.)
VERIFY: live 1280/375; form still submits.
COMMIT: `feat(home): token-align hero + trust/expectation line`

