import { Separator } from "provodnik-app";
export const Horizontal = () => (
  <div style={{ maxWidth: 320 }}>
    <div style={{ fontSize: 14, paddingBottom: 8 }}>Детали поездки</div>
    <Separator />
    <div style={{ fontSize: 14, paddingTop: 8, color: "#8A93A1" }}>21 июня · 10:00–18:00</div>
  </div>
);
