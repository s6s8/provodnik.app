# Verification upload error — storage bucket investigation (A4)

> Дата: 2026-05-27
> Предпосылка: [upload-error-2026-05-26.md](./upload-error-2026-05-26.md) (Cause B — storage bucket not found / RLS deny)

---

## TL;DR

**Вердикт: Cause B подтверждён.**
Миграция `20260401200000_storage_buckets.sql`, создающая bucket `guide-documents` в production,
**никогда не была применена к remote**. Bucket в production отсутствует.
Все локальные миграции с `20260401000000` по `20260524013232` — LOCAL ONLY.

---

## 1. Bucket name — совпадение ✅ (локально)

| Место | Значение |
|---|---|
| `src/lib/storage/buckets.ts:14` | `"guide-documents"` |
| `supabase/migrations/20260401200000_storage_buckets.sql:3` | `'guide-documents'` |
| `src/app/(protected)/guide/verification/actions.ts:14` | `z.literal("guide-documents")` |
| `src/features/guide/components/verification/document-upload-card.tsx:133` | `"guide-documents"` (hardcoded в вызове `onRequestUploadUrl`) |

Во всём app-слое название bucket согласовано. Внутренних расхождений нет.

---

## 2. Region — нерелевантен ✅

Supabase не даёт выбирать регион на уровне bucket. Регион задаётся один раз при создании проекта и не влияет на bucket config. Этот параметр исключён.

---

## 3. CORS — не обнаружено нарушений, но верификация только через Dashboard

`supabase/config.toml` не содержит секции `[storage]` или CORS-overrides:

```toml
project_id = "yjzpshutgmhxizosbeef"

[api]   # no [storage] section
[db]
[studio]
```

Supabase Storage по умолчанию допускает cross-origin запросы для signed-URL uploads.
Dashboard-уровень CORS (Storage → Settings → CORS) не трекируется в коде.
**Действие**: при доступе к Dashboard проверить список CORS origins — убедиться, что `provodnik.app` не заблокирован.
На текущий момент CORS не рассматривается как причина ошибки; доминирует отсутствие bucket.

---

## 4. Permissions / RLS — policy написана, но в prod не существует

В `20260401200000_storage_buckets.sql` прописана корректная INSERT policy:

```sql
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('guide-avatars','guide-documents','listing-media','dispute-evidence')
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
```

Загрузка происходит через `getPresignedUploadUrl` → `createSupabaseAdminClient()` → `createSignedUploadUrl`.
Поскольку admin-клиент (service role) генерирует signed URL, фактическая загрузка из браузера проходит под service-role-signed token — RLS при upload bypass. Policy корректна и не является источником ошибки (при условии что bucket существует).

---

## 5. Критическая находка — divergence местных и production миграций

Вывод `npx supabase migration list`:

```
Local          | Remote         | Time (UTC)
20260331120000 | 20260331120000 | 2026-03-31 12:00:00   ← единственная общая миграция
20260401000000 |                | 2026-04-01 00:00:00   ← LOCAL ONLY (drop_all)
20260401000001 |                | 2026-04-01 00:00:01   ← LOCAL ONLY (полный schema reset)
...
20260401200000 |                | 2026-04-01 20:00:00   ← LOCAL ONLY (storage_buckets!)
...
               | 20260412020909 | 2026-04-12 02:09:09   ← remote-only (production SQL)
               | ...
               | 20260412022618 | 2026-04-12 02:26:18   ← remote-only
...
20260428000001 |                | 2026-04-28 00:00:01   ← LOCAL ONLY (guide_portfolio_bucket)
...
20260521120000 |                | 2026-05-21 12:00:00   ← LOCAL ONLY (traveler_avatars_bucket)
20260524013232 |                | 2026-05-24 01:32:32   ← LOCAL ONLY (последняя локальная)
```

**Интерпретация:**
- После `20260331120000` локальная и remote histories полностью разошлись.
- Local сделал полный DROP+RECREATE (апр 2026), remote продолжил инкрементальные изменения.
- Миграция `20260401200000_storage_buckets.sql`, создающая bucket `guide-documents` и его policies, **никогда не применялась к production**.
- Bucket `guide-documents` в production **с высокой вероятностью отсутствует**.

Подтверждение: Remote имеет `guide-media` bucket (из оригинального schema pre-reset, или из 20260412 SQL).
App-код verification flow обращается к `guide-documents` (переименованному bucket) — которого нет.

---

## 6. Sidebar: устаревшая ссылка в legacy-коде

`src/data/guide-assets/supabase-client.ts:118`:
```ts
bucketId: "guide-media",   // ← старое имя bucket
```

Этот файл импортируется `guide-onboarding-form.tsx` (`ensureGuideDocumentReservations`).
**Не является** причиной ошибки в verification upload form — тот flow использует server actions из `actions.ts`.
Но это смежный дефект: onboarding flow пишет в несуществующий bucket и тоже упадёт.
Вынесено в отдельное наблюдение; не меняет вердикт по A4.

---

## 7. Вердикт

| Параметр | Статус | Вывод |
|---|---|---|
| Bucket name | ✅ Совпадает во всём app-коде | не проблема |
| Region | ✅ Не конфигурируется per-bucket | не проблема |
| CORS | ⚠️ Dashboard не проверен | вторичен; проверить при доступе |
| RLS policies | ✅ Policy написана корректно | не проблема (при условии наличия bucket) |
| **Bucket existence in prod** | ❌ **Миграция LOCAL ONLY — bucket не применён к remote** | **ROOT CAUSE** |

**Bucket `guide-documents` отсутствует в production.**
`getPresignedUploadUrl` вернёт `StorageError` → server action выбросит → client получит ошибку.
Это объясняет симптом "ошибка после клика «Загрузить»".

---

## 8. Fix — что нужно и как применить

### Что делать

Создать новую идемпотентную миграцию (не включать в DROP/RECREATE цепочку):

**Файл:** `supabase/migrations/20260527000001_create_guide_documents_bucket.sql`

```sql
-- Idempotent: create guide-documents bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guide-documents',
  'guide-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: owner can upload to own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'guide_documents_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "guide_documents_insert" ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'guide-documents'
          AND split_part(name, '/', 1) = (SELECT auth.uid()::text))
    $policy$;
  END IF;
END $$;

-- RLS: owner and admin can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'guide_documents_select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "guide_documents_select" ON storage.objects FOR SELECT
        USING (bucket_id = 'guide-documents'
          AND (split_part(name, '/', 1) = (SELECT auth.uid()::text)
               OR public.is_admin()))
    $policy$;
  END IF;
END $$;
```

### Как применить к production (безопасно, без `db push`)

> ⚠️ Не использовать `supabase db push` — он попытается применить все LOCAL ONLY миграции,
> включая `drop_all.sql`, что уничтожит production data.

**Безопасный способ:**

```bash
# 1. Скопировать SQL выше
# 2. Открыть Supabase Dashboard → SQL Editor
# 3. Вставить SQL и выполнить
# 4. Убедиться в Storage → Buckets что "guide-documents" появился
# 5. Зафиксировать в репозитории файл миграции (без push в remote):
git add supabase/migrations/20260527000001_create_guide_documents_bucket.sql
git commit -m "feat(db): create guide-documents storage bucket (prod-apply manual)"
```

Или через Supabase CLI (только конкретная миграция):
```bash
supabase migration up --include-all  # ОПАСНО с diverged history
# Безопаснее:
supabase db execute --file supabase/migrations/20260527000001_create_guide_documents_bucket.sql
```

### Параллельно исправить legacy ref

`src/data/guide-assets/supabase-client.ts:118` изменить `"guide-media"` → `"guide-documents"`.
Это cursor-dispatch задача (затрагивает `src/`).

---

## 9. Next candidate (если bucket окажется в норме)

Если Dashboard покажет, что bucket `guide-documents` уже существует в production
(например, был создан одной из remote-only 20260412* миграций),
перейти к анализу **RSC async-prop (Cause A)**:

Проверить `src/app/(protected)/guide/profile/page.tsx` строки 305–313 —
убедиться что все 4 функции в `actions` являются модульными `'use server'` imports, а не closures с async wrapping.
Текущий код выглядит корректно (прямые imports из `actions.ts`),
но возможна регрессия в предыдущей версии страницы (проверить git blame / git log -- page.tsx).
## 10. CORRECTION 2026-05-27 — verdict revised after live verification

> The initial verdict in this audit ("bucket missing in prod") was incorrect.
> Direct verification against production via `PROVODNIK_SUPABASE_SECRET_KEY`
> shows the bucket exists and the upload flow works end-to-end.

### What was actually verified against prod 2026-05-27T08:30Z

GET `/storage/v1/bucket` returned 6 buckets including:

```json
{
  "id": "guide-documents",
  "name": "guide-documents",
  "public": false,
  "file_size_limit": 10485760,
  "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  "created_at": "2026-04-04T00:57:51.690Z"
}
```

Config exactly matches what migration `20260401200000_storage_buckets.sql` would have created. The bucket was provisioned in prod on 2026-04-04, presumably via a remote-only SQL operation (Dashboard manual apply or one of the remote-only `20260412*` migrations).

### Signed-URL upload flow tested live

| Step | Endpoint | Result |
|---|---|---|
| 1. createSignedUploadUrl | `POST /storage/v1/object/upload/sign/guide-documents/<uuid>/passport-test.jpg` | 200, returned token+url |
| 2. PUT to signed URL | `PUT /storage/v1/object/upload/sign/...` | 200, `{"Key":"guide-documents/.../passport-test.jpg"}` |
| 3. list confirms presence | `POST /storage/v1/object/list/guide-documents` | row visible with eTag |
| 4. cleanup | `DELETE /storage/v1/object/guide-documents/...` | 200, `{"message":"Successfully deleted"}` |

The backend upload pipeline (admin signs URL → client PUTs to signed URL) is fully functional in prod.

### Revised verdict

| Original (incorrect) | Corrected |
|---|---|
| Cause B: bucket missing in prod | **Bucket EXISTS in prod, correct config, upload tested** |
| Fix: apply migration `20260527000001_create_guide_documents_bucket.sql` | **No migration needed** |

### What this means for the actual upload error

The user-observed "Server Components render error" upon clicking «Загрузить» in prod is **not caused by bucket/RLS** — those are healthy. Investigation should resume on the other candidates from `upload-error-2026-05-26.md`:

- **Cause A (RSC async-prop):** verification-form receives `actions` prop. Static review (this session) shows `actions` is built from direct module imports of `'use server'` functions — looks correct. But a runtime regression could still produce a serialization error. Next step: reproduce in browser dev tools and read the actual error stack.
- **Cause C (AP-014 inline closure):** static review of `document-upload-card.tsx` shows actions consumed via destructured props, not inline closures. Looks correct.

Both A and C require **live browser repro** with a real guide account to confirm. Cannot conclude statically.

### Migration history clarification

The audit section 5 finding about local↔remote migration divergence remains true: most local 20260401-20260524 migrations were never applied to remote. However, the specific assertion "guide-documents bucket therefore doesn't exist" was wrong — the bucket was provisioned through a different path (the remote-only 20260412* migration set or Dashboard manual action).

The diverged-migration situation is a separate operator concern (covered by Cleanup C6 / migration alignment epic) but it does NOT block the verification upload flow.

### Remaining action items

1. **Live browser repro** of the upload error (operator + guide test account). Cannot proceed statically.
2. **Legacy reference at `src/data/guide-assets/supabase-client.ts:115`** — `bucketId: "guide-media"` should be `"guide-documents"` (separate fix, not audit scope).
3. Migration-history alignment between local and remote → existing Cleanup C6 epic.
