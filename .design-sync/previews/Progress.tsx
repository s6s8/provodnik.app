import { Progress } from "provodnik-app";
export const Default = () => (
  <div style={{ maxWidth: 320, display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ fontSize: 13, color: "#414B59" }}>4 / 6 мест занято</div>
    <Progress value={66} />
  </div>
);
