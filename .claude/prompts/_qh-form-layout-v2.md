# QuantumHands task: form-layout-v2

## File
`src/features/homepage/components/homepage-request-form.tsx`

## LANDMINE (HOT) — read before touching
- AP-040 / ID-005: multi-field rows use `sm:grid-cols-N` flat grids, NOT nested grids. A sibling FieldHint below an input adds variable cell height and breaks row alignment.
- ADR-025: cursor-agent uses Read/Edit/Write only. No git, no bun in this prompt.

---

## Goal
Five precise changes to the request form. Shrink the form by replacing standalone controls with inline icon toggles, merging two fields onto one row, showing more themes, and cleaning up the details hint.

---

## Change 1 — Date field: replace Toggle with inline ≈ button

Remove the `<Toggle>` block (currently below `<Input id="startDate">`):
```tsx
<Toggle
  size="sm"
  pressed={watch("dateFlexibility") !== "exact"}
  onPressedChange={(pressed) =>
    setValue("dateFlexibility", pressed ? "few_days" : "exact", { shouldDirty: true })
  }
  className="h-7 px-2 text-xs font-normal text-muted-foreground data-[state=on]:text-foreground"
>
  ≈ Гибкая дата
</Toggle>
```

Replace the `<Input id="startDate" ...>` with a wrapper `<div className="relative">` containing the input + an absolutely-positioned button:

```tsx
<div className="relative">
  <Input
    id="startDate"
    type="date"
    min={todayMoscowISODate()}
    className="pr-9"
    aria-invalid={Boolean(errors.startDate)}
    aria-describedby={errors.startDate ? "startDate-error" : undefined}
    {...register("startDate")}
  />
  <button
    type="button"
    title="Гибкая дата (±2–3 дня)"
    onClick={() =>
      setValue(
        "dateFlexibility",
        watch("dateFlexibility") !== "exact" ? "exact" : "few_days",
        { shouldDirty: true },
      )
    }
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-sm font-semibold transition-colors",
      watch("dateFlexibility") !== "exact"
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    ≈
  </button>
</div>
```

Also remove the `Toggle` import from the top of the file if it is no longer used anywhere else in the file after this edit. Search the file for `<Toggle` to confirm before removing.

---

## Change 2 — "Сколько вас" + "Бюджет на человека" on one row; assembly icon inside groupSize; remove standalone "Открытая группа"

### 2a. Remove the standalone "Открытая группа" label/checkbox
Delete the `<label>` element (the one with the checkbox that sets `mode` to `"assembly"` or `"private"`). It currently sits next to "Сколько вас" in a 2-col grid.

### 2b. Move "Бюджет на человека" into the same row as "Сколько вас"
The budget field is currently its own `<div className="grid gap-2">` section (section 6). Remove that separate section entirely and inline the budget field into the 2-col row alongside "Сколько вас".

### 2c. Add assembly icon button inside "Сколько вас" input

Wrap `<Input id="groupSize" ...>` in a relative div and add a `UserPlus` icon button (import `UserPlus` from `"lucide-react"`). Clicking it toggles `mode` between `"assembly"` and `"private"`. When `isAssembly` is true, button is `text-primary`; otherwise `text-muted-foreground`.

### New structure for this section (replace the entire section 4 + section 6 blocks):

```tsx
{/* 4. Сколько вас + Бюджет на человека */}
<div className="grid gap-3">
  <div className="grid grid-cols-2 items-start gap-2">
    <div className="grid gap-2">
      <FieldLabel htmlFor="groupSize">Сколько вас</FieldLabel>
      <div className="relative">
        <Input
          id="groupSize"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          className="pr-9"
          aria-invalid={Boolean(errors.groupSize)}
          {...register("groupSize", { valueAsNumber: true })}
        />
        <button
          type="button"
          title="Открытая группа — другие путешественники могут присоединиться"
          onClick={() =>
            form.setValue("mode", isAssembly ? "private" : "assembly", {
              shouldValidate: false,
              shouldDirty: true,
            })
          }
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded transition-colors",
            isAssembly
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>
      <FieldError id="groupSize-error" message={errors.groupSize?.message} />
    </div>
    <div className="grid gap-2">
      <FieldLabel htmlFor="budgetPerPersonRub">Бюджет на человека (₽)</FieldLabel>
      <Input
        id="budgetPerPersonRub"
        type="number"
        inputMode="numeric"
        min={1000}
        max={2000000}
        aria-invalid={Boolean(errors.budgetPerPersonRub)}
        aria-describedby="budgetPerPersonRub-total"
        {...register("budgetPerPersonRub", { valueAsNumber: true })}
      />
      <FieldError
        id="budgetPerPersonRub-error"
        message={errors.budgetPerPersonRub?.message}
      />
    </div>
  </div>
  <TotalBudgetHint
    id="budgetPerPersonRub-total"
    perPerson={watchedBudgetPerPerson}
    groupSize={watchedGroupSize}
  />
  <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-input bg-background px-3 py-2.5 hover:bg-muted/40">
    <input
      type="checkbox"
      className="mt-0.5 h-4 w-4 accent-primary"
      checked={allowGuideSuggestions}
      onChange={(e) => setAllowGuideSuggestions(e.target.checked)}
    />
    <span className="flex flex-col gap-0.5 text-sm">
      <span className="font-medium text-foreground">
        Разрешаю гидам предлагать близкие даты и время
      </span>
    </span>
  </label>
</div>
```

---

## Change 3 — Themes: show 6 by default

Change the `visibleThemes` filter from `index < 3` to `index < 6`:

```tsx
const visibleThemes = THEMES.filter(
  (theme, index) =>
    index < 6 || showAllThemes || selectedInterests.includes(theme.slug),
);
```

---

## Change 4 — Details: remove the FieldHint below the notes Textarea

Remove the `<FieldHint>` that currently appears after the `<Textarea id="notes">` inside the `<details>` block:
```tsx
<FieldHint>Пишите коротко — детали можно уточнить после первых откликов. Для заказа от юрлица добавьте сюда название компании, ИНН и тип документов.</FieldHint>
```

Keep the Textarea and its placeholder unchanged. Keep FieldError for notes.

If `FieldHint` is no longer used anywhere else in the file after this deletion, remove its import too.

---

## Acceptance checks (do not skip)
1. No TypeScript errors in the edited file (use Read tool to verify imports are correct).
2. `UserPlus` is imported from `"lucide-react"`.
3. `Toggle` import is removed if no longer used.
4. `FieldHint` import is removed if no longer used.
5. The separate budget section (comment `{/* 6. Бюджет на человека */}`) is gone — budget is now inside section 4.
6. "Открытая группа" standalone checkbox label is gone.
7. `index < 6` in visibleThemes.

## DONE report
List: files edited, unexpected findings. No git commands, no bun commands.
