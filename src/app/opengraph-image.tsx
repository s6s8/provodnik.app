import { ImageResponse } from "next/og";

// Static branded share card for the whole site (PRD-019). Generated with
// next/og (system fonts only — no external asset or font fetch), so links in
// Telegram/WhatsApp/Twitter render a preview instead of a bare URL. Per-guide
// dynamic cards can layer on top later; this covers every route by inheritance.

export const alt = "Provodnik — маркетплейс частных гидов по России";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #15233A 0%, #1E3A5F 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#4F8BD6",
            }}
          />
          <div style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-1px" }}>
            Provodnik
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "76px", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-2px" }}>
            Найди своего гида
          </div>
          <div style={{ fontSize: "36px", color: "#B9C9DD" }}>
            Частные экскурсии и проводники по России
          </div>
        </div>

        <div style={{ fontSize: "30px", color: "#8FA6C0" }}>provodnik.app</div>
      </div>
    ),
    { ...size },
  );
}
