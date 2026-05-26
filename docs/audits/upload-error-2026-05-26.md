# Verification documents upload — diagnostic (Phase A, form-epic #15)

> Дата: 2026-05-26
> Скоуп тикета: diagnostic only — fix лечится отдельным тикетом после прочтения этого документа.

## Где

- Страница: `src/app/(protected)/guide/profile/verification/page.tsx` (Server Component)
- Форма: `src/features/guide/components/verification/verification-upload-form.tsx` (`'use client'`)
- Карточка загрузки: `src/features/guide/components/verification/document-upload-card.tsx`
- Server actions (через props, обёрнуты в Server Action wrappers):
  - `getUploadUrl(bucket, fileName, mimeType)` — выдаёт signed upload URL
  - `confirmGuideAssetUpload(...)` — записывает asset row
  - `confirmDocumentUpload(assetId, documentType)` — связывает asset с guide_documents
  - `submitForVerification()` — переводит профиль в submitted

## Что наблюдается в prod

Симптом: при загрузке документа верификации Server Components возвращает render error. Ошибка появляется на стороне клиента после клика «Загрузить».

## Три наиболее вероятные root cause (по убывающей вероятности)

### A. RSC передаёт Promise/non-serializable как prop в Client Component

`VerificationUploadFormProps.actions` принимает объект из 4 функций. Если page.tsx собирает этот объект через async wrapper'ы и при этом одно из значений случайно остаётся Promise-ом (не awaited), Server Components попытается сериализовать Promise → render-time ошибка.

**Что проверить:** в `verification/page.tsx` убедиться, что все 4 функции в `actions` — это либо stable references (модульные `'use server'` функции, импортированные), либо результаты `await`'а. Любая `getUploadUrl: someAsyncFn(...)` без правильного closure упадёт.

### B. Supabase Storage bucket не существует / RLS deny

Если bucket с именем, переданным в `getUploadUrl`, не существует в текущей среде (dev / prod), или RLS policy запрещает insert от роли `authenticated`, signed URL вернёт 403/404 silently, и при попытке fetch'нуть его клиент получит сетевую ошибку, которая мапится в RSC error overlay.

**Что проверить:** `supabase/migrations/` на наличие `storage.buckets` insert с правильным именем; ACL для `authenticated` роль на `storage.objects` для этого bucket.

### C. AP-014 / async-prop anti-pattern на DocumentUploadCard

Если `document-upload-card.tsx` использует Server Action как inline prop (`onConfirm={async (...) => ...}`), React 19 RSC может выдать «Functions cannot be passed directly to Client Components» при сериализации.

**Что проверить:** все 4 функции в `actions` объявлены с `'use server'` и импортированы как module-level references, не inline closures.

## Минимальный repro

1. Запустить dev server: `bun run dev`.
2. Открыть `/guide/profile/verification` под ролью гида.
3. В первой карточке («Паспорт») нажать input file, выбрать любую PNG/JPG/PDF.
4. Наблюдать в браузерной консоли + терминале dev server — ожидается RSC error либо в Network (на запрос signed URL), либо в React render tree.

## Рекомендуемый fix (отдельный тикет)

- Если cause A: переписать `verification/page.tsx` так, чтобы actions передавались либо как импорты модуля, либо все четыре функции были awaited.
- Если cause B: добавить миграцию `storage.buckets` insert (или править RLS policy) + повторить storage bucket creation.
- Если cause C: вынести все Server Actions из inline-prop'ов в отдельные `actions.ts` файлы рядом с компонентами + использовать через `'use server'` imports.

Размер потенциального fix-тикета: **S** (если cause A или C — UI-only refactor), **M** (если cause B — нужна миграция + redeploy).

## Что не входит в этот тикет

- Применение fix. Создаётся отдельный тикет после диагностики.
- Анализ других ошибок upload-flow вне Server Components scope (UI-only).
