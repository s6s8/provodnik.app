# ROADMAP — provodnik

> Durable forward backlog. Auto-harvest appends here on `/epic` and `/think`
> close; hand-edit freely. The live ticket queue is `NEXT_PLAN.md` — this is
> the future.
>
> Provenance tags: `[owner-verified]` = confirmed by Alex; `[bot-derived]` =
> an observation the orchestrator inferred, not yet owner-confirmed — treat as
> open, never as established fact.

## Planned
- Admin card restructuring is deferred to Phase B Karelia; it is out of scope for the current cleanup epic. — «Реструктурирование — out of scope cleanup, может быть Phase B Карелия.» (harvest epic E-76 msg-18)
- Track orchestrator gaps R1/R5, R7, and R8 as a separate future epic. — «Orchestrator gaps surfaced this cycle (worth a separate epic):» (harvest epic E-33 msg-7)
- City arrays and base_city removal are deferred; do not implement now. — «Массив городов и убирание base_city — НЕ делаем сейчас.» (harvest epic E-33 msg-6)

(no planned epics recorded yet — auto-harvest appends here as the owner names them)

## Open questions
- Message [0] contains no decisions — it is a directive to investigate and explain existing behavior before making changes. No terminology fixes, scope/MVP decisions, do/don't rules, process rules, or roadmap items are stated. (harvest epic E-135)
- Messages [22]–[27] mix owner instructions with what appear to be autonomous agent status reports (e.g., 'Что зашло', 'Что не зашло', ticket state lists). Which statements in those messages represent owner decisions versus bot-generated summaries is not always unambiguous. (harvest epic E-76)
- Admin card audit C4 [18]: owner said to 'check at decomposition time' which specific fields (legal_status, inn, document_country, is_tour_operator, tour_operator_registry_number) are missing — no final decision on the exact field list was stated. (harvest epic E-76)
- Questions A (DB migration risk for existing mode=assembly requests), C (trust-strip: new component vs. existing; i18n vs. hardcode for Phase A), and F (ticket count estimate) from [14] were posed but never explicitly answered by the owner in any subsequent message. (harvest epic E-76)
- Hero copy in [14] used Elista-specific text (H1: 'Частный гид по Элисте...', Sub: 'гиды Элисты ответят...'), explicitly overridden in [20]. It is unclear whether the original city-specific strings should be preserved for any purpose (e.g., Phase A admin notes, archived mockups) or are fully discarded. (harvest epic E-76)
- Commission rate conflict raised in [24]: PRD §15 set 10% Phase A; KODEX 'Три модели' had 15%/25% model-dependent rates. Owner presented options а/б/в without resolving in msg [24]. Msg [25] reports 10% as 'fixed' but reads as an agent status report, not a clear owner directive — authorship of the resolution is ambiguous. (harvest epic E-76)
- [8] No decision on which next-step option the director chooses: A (close epic at 3/6, defer T2/T4/T5 to new epic), B (manual cursor-dispatch for T2/T4/T5), or C (add 4th orch fix for SPEC_CRITIQUE perfectionism convergence first). (harvest epic E-33)
- [0]+[6] The exact error text shown to Alex when the approve action failed is unknown, preventing definitive root-cause confirmation. (harvest epic E-33)
- [6]+[7] Whether Alex's Supabase profile has profile.role=admin is unconfirmed; until checked, the root cause of Bug 1's approve-fail (data vs. code/RLS) cannot be determined. (harvest epic E-33)
- Message [1] asks about task definition and verification method — no explicit decision made, only inquiries. (harvest epic E-30)
- Message [0] asks questions about task count and decomposition status — no explicit decision made, only inquiries. (harvest epic E-30)
- Message [0] contains no explicit decisions — it is a procedural prompt requesting a short response to end the session. (harvest epic E-28)
- [6] Owner states migration 20260502000002_add_date_flexibility.sql was applied to production 'with owner's permission' — ambiguous whether this establishes a standing rule for applying unapplied migrations on discovery, or was a one-off authorisation. (harvest epic E-19)
- [7] Owner asks 'is this epic tasks fully complete, and ready to close?' — no explicit decision issued; the question awaits agent confirmation before the owner can decide. (harvest epic E-19)

(нет открытых вопросов)

Прошлые записи сняты 2026-05-18:
- Модели 2 и 3 — определены и зафиксированы в `KODEX.md` §«Три модели
  продукта».
- «флагман», «лента», «первая волна», «достроить сборную» — подтверждено в
  think «all-memory», что это выдумка бота, а не термины продукта; удалены.
- harvest-артефакты think-dbprobe / think-gc6probe — это были вопросы, не
  решения; удалены как шум.
