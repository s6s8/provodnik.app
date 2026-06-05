/*
Архив блока "Что входит в цену".

Убрали из bid-form-panel по договоренности через чат: этот блок больше не показывается
и не отправляет inclusions в offer action.

const INCLUSION_OPTIONS = [
  "Транспорт",
  "Входные билеты",
  "Обед",
  "Вода / напитки",
  "Снаряжение",
  "Фотосъёмка",
  "Трансфер из отеля",
  "Сувениры",
] as const;

const [inclusions, setInclusions] = React.useState<string[]>([]);
const [customInclusion, setCustomInclusion] = React.useState("");

const toggleInclusion = React.useCallback((label: string) => {
  setInclusions((prev) =>
    prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label],
  );
}, []);

const addCustomInclusion = React.useCallback(() => {
  const v = customInclusion.trim();
  if (!v) return;
  setInclusions((prev) => (prev.includes(v) ? prev : [...prev, v]));
  setCustomInclusion("");
}, [customInclusion]);

fd.set("inclusions", JSON.stringify(inclusions));

{\/\* Что входит в цену *\/}
<div className="grid gap-2">
  <label className="text-sm font-medium text-foreground">Что входит в цену</label>
  <div className="flex flex-wrap gap-2">
    {INCLUSION_OPTIONS.map((label) => {
      const active = inclusions.includes(label);
      return (
        <button
          key={label}
          type="button"
          disabled={submitted}
          aria-pressed={active}
          onClick={() => toggleInclusion(label)}
          className={
            active
              ? "min-h-[2.25rem] rounded-full border border-primary bg-primary/10 px-3 text-xs font-medium text-primary"
              : "min-h-[2.25rem] rounded-full border border-border bg-surface-high px-3 text-xs text-muted-foreground hover:border-primary/40"
          }
        >
          {active ? "✓ " : "+ "}
          {label}
        </button>
      );
    })}
    {inclusions
      .filter((v) => !INCLUSION_OPTIONS.includes(v as (typeof INCLUSION_OPTIONS)[number]))
      .map((label) => (
        <button
          key={label}
          type="button"
          disabled={submitted}
          aria-pressed={true}
          onClick={() => toggleInclusion(label)}
          className="min-h-[2.25rem] rounded-full border border-primary bg-primary/10 px-3 text-xs font-medium text-primary"
        >
          ✓ {label}
        </button>
      ))}
  </div>
  <div className="flex items-center gap-2">
    <input
      type="text"
      value={customInclusion}
      onChange={(e) => setCustomInclusion(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addCustomInclusion();
        }
      }}
      placeholder="Добавить своё (например, аудиогид)"
      disabled={submitted}
      maxLength={80}
      className={FIELD_CLASS}
    />
    <Button
      type="button"
      variant="outline"
      onClick={addCustomInclusion}
      disabled={submitted || customInclusion.trim().length === 0}
      className="shrink-0"
    >
      Добавить
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">
    Отметьте то, что не нужно оплачивать отдельно. Гость увидит этот список в карточке предложения.
  </p>
</div>
*/
