import { Chip } from "provodnik-app";
export const Facts = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <Chip label="Дата" value="21 июня" />
    <Chip label="Время" value="10:00–18:00" />
    <Chip label="Бюджет" value="3 000 ₽/чел" />
  </div>
);
