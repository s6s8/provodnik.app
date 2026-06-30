import { FieldShell } from "provodnik-app";
export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <FieldShell>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A56A4" strokeWidth="2" aria-hidden>
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
      </svg>
      <input style={{ border: 0, background: "transparent", outline: "none", flex: 1, font: "inherit", fontWeight: 700 }} defaultValue="Элиста" />
    </FieldShell>
  </div>
);
