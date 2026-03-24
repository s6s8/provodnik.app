# Provodnik Knowledge
## Session Handoff — 2026-03-19

This file captures the stable outcomes of the work completed today so the project does not need to reconstruct the same context again.

## 1. Project context

- Local project root: `D:\dev\projects\provodnik`
- Code repository: `D:\dev\projects\provodnik\provodnik.app`
- Tasks repository: `D:\dev\projects\provodnik\provodnik.app-Tasks`
- Core design inputs used today:
  - `D:\dev\projects\provodnik\design\LAYOUT.md`
  - `D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md`
  - `D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md`
- Core product inputs used today:
  - `D:\dev\projects\provodnik\provodnik.app\MARKET_RESEARCH.md`
  - `D:\dev\projects\provodnik\provodnik.app\MVP.md`
  - `D:\dev\projects\provodnik\provodnik.app\PRD.md`

## 2. Slack operating model

The project was intentionally simplified to a single active Slack channel.

- Active channel: `#all-provodnik`
- Purpose of this channel:
  - single board-facing and team-facing stream
  - project status
  - product decisions
  - key documents
  - comments in threads

### Rule of use

- Key updates and decisions are posted only in `#all-provodnik`
- The canonical reference material lives in pinned documents and files
- Discussion and feedback happen in threads under the relevant message
- After any material product change, the relevant reference document must be updated the same day
- Tasks and execution details should remain outside Slack if they do not need board visibility

## 3. Current Slack assets

### Canvases

Two core canvases should be treated as the current project references:

1. Status and plan canvas
   - Slack file id: `F0AMV791C2D`
   - Title: `ПРОВОДНИК: статус и план`
   - Purpose:
     - what we are building
     - updated MVP
     - product structure changes
     - implementation plan

2. Market research canvas
   - Slack file id: `F0AMG7V1134`
   - Title: `ПРОВОДНИК: исследование рынка`
   - Purpose:
     - market framing
     - competitors
     - market wedge
     - strategic positioning

### Current board PDF in Slack

- Slack file id: `F0AML7A5ZT6`
- Slack permalink:
  - `https://provodnik.slack.com/files/U0AMCJZD0HY/F0AML7A5ZT6/provodnik-board-brief.pdf`
- Posted message timestamp:
  - `1773869400.138879`
- This is the currently accepted board PDF upload

## 4. Local document outputs created today

### Canonical source used for the board PDF

- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-source.md`

This markdown source is the safest place to edit if a new board PDF needs to be regenerated.

### Current preferred PDF

- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v5.pdf`

This is the latest PDF version that was accepted as the replacement for previous broken versions.

### Intermediate files created during debugging

These exist because several PDF and DOCX variants were tested while fixing Cyrillic issues:

- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru.docx`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru.pdf`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v2.docx`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v2.pdf`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v3.docx`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v3.pdf`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v4.docx`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v4.pdf`
- `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-v5.docx`

Unless specifically needed for comparison, these older variants should be treated as debugging artifacts, not canonical references.

## 5. What was decided today

### Product structure

- Provodnik should not be positioned as a generic excursions catalog
- The strongest model is request-first with catalog support
- Homepage logic should support two equal entrances:
  - exchange / request flow
  - ready-made tours
- Group formation and budget-sensitive demand are central to the product wedge
- Region visibility must be explicit across requests and destination pages
- Tour pages need constructor-like itinerary logic, including transfers between stops
- Request pages must make price sensitivity to group size visible

### Launch strategy

- Do not launch as all-Russia in operational reality
- Start with a narrow regional wedge
- Validate liquidity before breadth
- Trust, moderation, review logic, and booking discipline are mandatory early

### Slack strategy

- One-channel model is better for the current project stage than many workstream channels
- Board and team should both reference the same channel, with threads for separation of discussion
- Canvases are used for persistent project knowledge
- Uploaded PDF is used for structured board-ready reading

## 6. Issues discovered today

### 1. Slack Canvas title and message encoding

Problem:
- Cyrillic text sometimes turned into `????` when passed through Windows shell/API calls incorrectly

What worked:
- reading text from UTF-8 files before sending API updates
- avoiding raw inline Cyrillic payloads in fragile command paths

### 2. DOCX Russian rendering

Problem:
- DOCX uploads did not hold Russian correctly in Slack-facing usage

Resolution:
- switched from DOCX as the board deliverable to PDF

### 3. PDF Cyrillic rendering

Problem:
- first PDF generation path produced broken Russian glyph output

Resolution:
- several generation strategies were tested
- the latest accepted file is `provodnik-strategic-overview-ru-v5.pdf`
- its content source is `provodnik-strategic-overview-ru-source.md`

Important note:
- some PDF generation paths may still extract text imperfectly from title blocks
- if a future PDF version is needed, validate the actual rendered output in a PDF viewer before posting to Slack

## 7. How to update the board PDF next time

Recommended path:

1. Edit:
   - `D:\dev\projects\provodnik\deliverables\provodnik-strategic-overview-ru-source.md`
2. Regenerate a new versioned PDF in:
   - `D:\dev\projects\provodnik\deliverables\`
3. Upload the new PDF to `#all-provodnik`
4. Post one clean announcement message with the PDF link
5. Delete prior broken or superseded Slack file messages so the channel remains clean

## 8. What should be treated as current truth

If a future session needs fast orientation, the current truth should be taken from:

- Product and market direction:
  - `D:\dev\projects\provodnik\provodnik.app\MARKET_RESEARCH.md`
  - `D:\dev\projects\provodnik\provodnik.app\MVP.md`
  - `D:\dev\projects\provodnik\provodnik.app\PRD.md`
- Design and structural changes:
  - `D:\dev\projects\provodnik\design\LAYOUT.md`
  - `D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md`
  - `D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md`
- Slack knowledge base:
  - status canvas `F0AMV791C2D`
  - market research canvas `F0AMG7V1134`
  - board PDF `F0AML7A5ZT6`
- This session handoff file:
  - `D:\dev\projects\provodnik\KNOWLEDGE-2026-03-19.md`

## 9. Recommended next step

The most useful next documentation step would be to consolidate the board-facing materials into a stable pack:

- one board brief PDF
- one status canvas
- one market research canvas
- one short update template for weekly posting in `#all-provodnik`

That would reduce future churn and make updates incremental instead of reconstructive.
