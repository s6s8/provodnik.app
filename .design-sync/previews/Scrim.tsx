import { Scrim } from "provodnik-app";
export const Photo = () => (
  <div style={{ position: "relative", width: 280, height: 160, borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg,#1A56A4,#2F8F66)" }}>
    <Scrim />
    <div style={{ position: "absolute", bottom: 12, left: 14, color: "#fff", fontWeight: 700, fontSize: 18 }}>Элиста</div>
  </div>
);
