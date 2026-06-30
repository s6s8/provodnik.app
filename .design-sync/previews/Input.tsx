import { Input, Label } from "provodnik-app";
export const Default = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 320 }}>
    <Label>Направление</Label>
    <Input placeholder="Куда едете?" defaultValue="Элиста" />
  </div>
);
export const Disabled = () => <Input placeholder="Недоступно" disabled />;
