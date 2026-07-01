/**
 * Guide kind captured at signup. Shared by the client form (auth-entry-screen)
 * and the server action (signUpAction), so this module stays free of any
 * server-only imports (AP-014 client/server boundary).
 */

export const GUIDE_TYPES = [
  { id: "individual_guide", label: "Индивидуальный гид" },
  { id: "agency_representative", label: "Представитель агентства" },
  { id: "guide_team", label: "Команда гидов" },
] as const;

export type GuideType = (typeof GUIDE_TYPES)[number]["id"];

export const DEFAULT_GUIDE_TYPE: GuideType = "individual_guide";

const GUIDE_TYPE_IDS = new Set<string>(GUIDE_TYPES.map((t) => t.id));

export function isGuideType(value: string | null | undefined): value is GuideType {
  return typeof value === "string" && GUIDE_TYPE_IDS.has(value);
}
