# ROADMAP — provodnik

> Durable forward backlog. Auto-harvest appends here on `/epic` and `/think`
> close; hand-edit freely. The live ticket queue is `NEXT_PLAN.md` — this is
> the future.
>
> Provenance tags: `[owner-verified]` = confirmed by Alex; `[bot-derived]` =
> an observation the orchestrator inferred, not yet owner-confirmed — treat as
> open, never as established fact.

## Planned
- Track orchestrator gaps R1/R5, R7, and R8 as a separate future epic. — «Orchestrator gaps surfaced this cycle (worth a separate epic):» (harvest epic E-33 msg-7)
- City arrays and base_city removal are deferred; do not implement now. — «Массив городов и убирание base_city — НЕ делаем сейчас.» (harvest epic E-33 msg-6)

(no planned epics recorded yet — auto-harvest appends here as the owner names them)

## Open questions
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
