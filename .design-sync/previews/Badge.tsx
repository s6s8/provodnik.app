import { Badge } from "provodnik-app";
export const Tones = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
    <Badge>3 отклика</Badge>
    <Badge variant="info">Сборная группа</Badge>
    <Badge variant="success">Гид выбран</Badge>
    <Badge variant="warning">Ждёт гида</Badge>
    <Badge variant="destructive">Отклонён</Badge>
    <Badge variant="outline">Черновик</Badge>
  </div>
);
