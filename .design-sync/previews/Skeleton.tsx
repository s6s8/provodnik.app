import { Skeleton } from "provodnik-app";
export const Card = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
    <Skeleton style={{ height: 148, borderRadius: 16 }} />
    <Skeleton style={{ height: 18, width: "60%" }} />
    <Skeleton style={{ height: 14, width: "85%" }} />
  </div>
);
