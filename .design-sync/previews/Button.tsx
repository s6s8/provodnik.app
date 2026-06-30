import { Button } from "provodnik-app";
export const Variants = () => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
    <Button>Найти гида</Button>
    <Button variant="outline">Подробнее</Button>
    <Button variant="secondary">Отмена</Button>
    <Button variant="ghost">Пропустить</Button>
    <Button variant="destructive">Удалить</Button>
    <Button variant="link">Все группы</Button>
  </div>
);
export const Sizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Button size="sm">Маленькая</Button>
    <Button>Обычная</Button>
    <Button size="lg">Большая</Button>
  </div>
);
export const Loading = () => <Button loading>Отправляем…</Button>;
