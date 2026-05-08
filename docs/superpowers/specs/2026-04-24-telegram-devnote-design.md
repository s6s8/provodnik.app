# Telegram Dev-Note — Design

**Date:** 2026-04-24
**Scope:** new file `.claude/logs/telegram-devnote.mjs`
**Type:** new tool
**Goal:** Render the same dev-note JSON that `slack-devnote.mjs` consumes into clean Telegram HTML and post to the dev chat (`chat_id 109577644`). Same source of truth as Slack, native rendering per platform.

---

## 1. Motivation

Copying Slack mrkdwn into Telegram produces raw asterisks, broken bullets, and noisy per-line emoji. We need a Telegram-native renderer reading the **same** items JSON, so the two channels stay in sync without re-authoring content.

## 2. Non-goals

- No new schema fields. Reads the existing `theme / items / capabilities / hours_override` shape.
- No editing previous Telegram messages. Always posts fresh.
- No state file. No same-day merge.
- No re-sanitization — items JSON is already sanitized when it reaches Slack.
- No coupling to `slack-devnote.mjs`. Two separate commands.
- No Markdown / MarkdownV2. HTML parse_mode only.

## 3. CLI

```bash
node .claude/logs/telegram-devnote.mjs <items.json> [--dry]
```

- `<items.json>` — path to the same JSON file passed to `slack-devnote.mjs`.
- `--dry` — print the rendered HTML payload(s) and the API call(s) that would fire; do not POST.

Exit codes:
- `0` on success (all messages POSTed and Telegram responded `ok: true`).
- `1` on validation failure (missing file, missing `theme`, no items).
- `2` on Telegram API failure (HTTP non-2xx or `ok: false`). Print response body for debugging.

## 4. Credentials and target

Read from environment, not from JSON:

- `TELEGRAM_DEVNOTE_BOT_TOKEN` — bot token. If absent, fall back to `TELEGRAM_BOT_TOKEN`. If still absent, exit 1.
- `TELEGRAM_DEVNOTE_CHAT_ID` — chat id. If absent, fall back to hardcoded `109577644` (dev chat).

Documented in script header. Tokens never logged.

## 5. Layout

Each message is HTML with `<b>` for headers and area names. Items grouped by `kind` in this order:

```
🛠 <b>{theme}</b>
{DD.MM.YY}

✨ <b>Новое</b>
• <b>{area}</b> — {text}
• <b>{area}</b> — {text}
…

🔄 <b>Изменения</b>
• <b>{area}</b> — {text}
…

🔧 <b>Исправления</b>
• <b>{area}</b> — {text}
…

⬆️ <b>Улучшения</b>
• <b>{area}</b> — {text}
…

🏗 <b>Технические</b>
• <b>{category}</b> — {text}
…

🚀 <b>Продукт теперь умеет:</b>
• {capability sentence}
• {capability sentence}
…
```

Group rules:

| `kind` value in JSON | Section header | Emoji |
|---|---|---|
| `new` | Новое | ✨ |
| `change` | Изменения | 🔄 |
| `fix` | Исправления | 🔧 |
| `improve` | Улучшения | ⬆️ |
| `tech` | Технические | 🏗 |

A section is omitted entirely when it has zero items. Order of sections is fixed (above). Order of items within a section preserves JSON order.

For `kind: tech`, the bold prefix is `category` (e.g. `arch`, `infra`, `debug`, `docs`) instead of `area` — matching the Slack convention.

`capabilities` block appears at the bottom only if present and non-empty.

## 6. HTML escaping

Escape `<`, `>`, `&` in every `theme`, `area`, `category`, `text`, and `capability` value before insertion. No exceptions. Em-dash separator is literal `—` (no escape needed in HTML).

## 7. Length handling

Telegram message limit: 4096 chars. Build the full message; if >4000 chars, split into N parts:

- Split on section boundaries first (don't break a section in half).
- If a single section >4000 chars, split on item boundaries within it.
- Each part gets a `(N/M)` suffix on the title line: `🛠 <b>{theme}</b> (1/3)`.
- Footer (date + hours) appears only on part 1.
- Capabilities block stays on the last part.

If a single item's text is itself >4000 chars (extreme edge case), truncate with `…` and continue.

## 8. Sending

Use `https://api.telegram.org/bot{token}/sendMessage` with:

```json
{
  "chat_id": <chat_id>,
  "text": "<rendered HTML>",
  "parse_mode": "HTML",
  "disable_web_page_preview": true
}
```

For multi-part: send sequentially, await each response. If part N fails, abort and exit 2 (don't keep posting partial threads).

## 9. Hours / cost

**Not rendered.** Telegram message intentionally omits hours and cost — they belong in the Slack dev-note (where the audience tracks engineering spend), not in the Telegram channel. `hours_override` in the JSON is ignored if present; validation does not require it.

## 10. Validation

Before rendering, validate the JSON:

- File exists and parses as JSON.
- `theme` is a non-empty string.
- `items` is an array with at least 1 element.
- Each item has a recognized `kind`. Items with `kind: tech` need `category`; others need `area`. All need `text`.
- `capabilities` (if present) is an array of strings.

On any validation failure: print clear error message, exit 1.

## 11. Tests

`.claude/bek/test/` is for the bot — wrong location. Co-locate with the script: create `.claude/logs/test/telegram-devnote.test.mjs`. Run via `node --test .claude/logs/test/telegram-devnote.test.mjs`.

Coverage:
- Renders all five `kind` sections in correct order.
- Omits sections with zero items.
- Preserves item order within a section.
- Escapes HTML special chars in theme/area/text.
- Splits at 4000-char boundary, adds `(N/M)` suffix.
- Capabilities block rendered correctly when present, omitted when absent.
- Validation errors for bad JSON, missing theme, empty items, missing category for tech items.

For the actual HTTP send: mock the `fetch` call. Don't hit the real Telegram API in tests.

## 12. Delivery artifacts

- `.claude/logs/telegram-devnote.mjs` — the script.
- `.claude/logs/test/telegram-devnote.test.mjs` — tests.
- One paragraph in `~/.claude/CLAUDE.md` § 6 step 5 (post-work protocol) noting the new command. Also mirror this in the project `.claude/CLAUDE.md` Slack section.
- README updates if there's one for `.claude/logs/`. (Check during implementation.)

## 13. Risks

| Risk | Mitigation |
|---|---|
| Telegram HTML rejects an unescaped `<` | Centralized `escapeHtml()` applied to every value before insertion. Test specifically covers this. |
| Multi-part split breaks mid-tag | Split on logical (section/item) boundaries, not character offsets. Test covers exact 4000-char threshold. |
| Wrong chat id silently sent | `--dry` lets you inspect before posting. Hardcoded fallback is the dev DM; not a public channel. |
| Token leak in logs | Never log `process.env.TELEGRAM_*`. Print `[token: present]` / `[token: missing]`. |

## 14. Out of scope (deferred)

- Auto-trigger from `slack-devnote.mjs`.
- Editing / deleting previous Telegram messages.
- Multi-chat support.
- Inline keyboard buttons.
- Telegram threads / topics in supergroups.
- Shared `lib/hours.mjs` between Slack and Telegram.
- Different formats for different audiences (everyone gets the same HTML body).
