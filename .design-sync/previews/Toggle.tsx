import { Toggle } from "provodnik-app";
export const States = () => (
  <div style={{ display: "flex", gap: 12 }}>
    <Toggle>Гибкие даты</Toggle>
    <Toggle pressed>Сборная</Toggle>
  </div>
);
