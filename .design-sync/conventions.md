# Provodnik UI Kit — how to build with it

Provodnik is a Russian travel marketplace (travellers ↔ local guides). The UI is a **Tailwind v4 + shadcn/radix** system in the "Clean Trust" theme: navy primary, amber accent, green success, on a near-white surface, **Onest** font. Copy is **Russian**.

## Wrapping (required)
Every tree must be wrapped in **`<DsProvider>`** — it supplies the data-query context and a runtime shim the components expect. Without it, components that use data/hooks render blank.

```jsx
<DsProvider>
  <Button>Найти гида</Button>
</DsProvider>
```

The components are styled by the stylesheet (`styles.css` → `_ds_bundle.css`); the design tokens (CSS variables + utilities) come from there. No theme prop is needed — styling is via utility classes.

## Styling idiom — Tailwind utilities backed by tokens
Style layout/glue with these **real token-backed utility classes** (do NOT invent hex values or off-token Tailwind colors like `bg-blue-500`):

| Role | Class |
|---|---|
| Primary (navy `#1A56A4`) | `bg-primary` `text-primary` `border-primary` |
| Amber accent | `bg-gold` `text-gold` (soft: `bg-amber-tint`) |
| Success (green `#2F8F66`) | `text-success` `bg-green-tint` |
| Page / card / muted surfaces | `bg-surface` · `bg-card` · `bg-muted` |
| Ink / body / muted text | `text-foreground` · `text-ink-2` · `text-muted-foreground` |
| Hairline border | `border-border` |
| Radii | `rounded-card` (16) · `rounded-step` (12) · `rounded-pill` · `rounded-hero` (18) |
| Elevation | `shadow-card` · `shadow-lift` |
| Layout | `max-w-page` (1160) · `px-gutter` |
| Display type | `text-display` (hero) · `text-section` (H2) |
| Font | Onest via `font-sans` (default) |

Soft "tint" fills (`bg-primary-tint` / `bg-amber-tint` / `bg-green-tint`) are the system's status-pill backgrounds — used by `Badge` variants `info` / `warning` / `success`.

## Components (real exports)
Compose from the library, never re-implement: **Button** (`variant`: default·outline·secondary·ghost·destructive·link; `size`: sm·default·lg), **Badge** (`variant`: default·info·warning·success·destructive·overlay), **Card** (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`), **Input** · **Textarea** · **Label** · **Select** · **Tabs** (+`TabsList`/`TabsTrigger`/`TabsContent`) · **Dialog** · **Tooltip** · **Table** · **Avatar** · **Calendar** · **Chip** (label/value fact pill) · **Tag** (`color`: primary·amber·green) · **Scrim** (`variant`: card·hero — photo overlay) · **FieldShell** (icon+input shell) · **EmptyState** · **Progress** · **Separator** · **Skeleton**.

## Where the truth lives
Read each component's **`<Name>.d.ts`** (props) and **`<Name>.prompt.md`** (usage) before composing. The full styling vocabulary is the compiled stylesheet in the closure (`styles.css` → `_ds_bundle.css`).

## Idiomatic example
```jsx
<DsProvider>
  <Card className="max-w-page">
    <CardHeader>
      <CardTitle>Элиста · Калмыкия</CardTitle>
      <CardDescription>Сборная группа · 21 июня</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">Сборная группа</Badge>
        <Badge variant="success">Гид выбран</Badge>
      </div>
    </CardContent>
    <CardFooter>
      <Button>Присоединиться</Button>
    </CardFooter>
  </Card>
</DsProvider>
```
