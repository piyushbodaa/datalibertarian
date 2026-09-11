/** MoSPI CPI 2024 Combined division weights (HCES 2023-24) and July 2026 Combined inflation. */

export type HatchTone = "rust" | "carbon" | "ochre" | "zinc";

export type CpiDivision = {
  id: string;
  label: string;
  /** Combined 2024 weight, percent. */
  weight: number;
  /** July 2026 Combined 12-month inflation, percent, if printed. */
  yoyPct: number;
  index?: number;
  href: string;
  hatch: HatchTone;
  /** Unique slice colour. */
  color: string;
  citationId: string;
};

const W = "mospi-cpi-2024-weights";
const I = "mospi-cpi-2026-07";

/**
 * Combined 2024 weights from MoSPI Annex V (FAQ table).
 * Two-decimal Combined column as commonly printed; they sum to 100.00.
 * July 2026 Combined inflation from PIB PRID 2298247 Annex I.
 */
export const CPI_DIVISIONS: CpiDivision[] = [
  { id: "food", label: "Food and beverages", weight: 36.75, yoyPct: 5.24, index: 109.1, href: "/inflation/food", hatch: "rust", color: "#e07050", citationId: I },
  { id: "housing", label: "Housing, water, electricity, gas", weight: 17.66, yoyPct: 2.16, index: 103.85, href: "/inflation/housing", hatch: "carbon", color: "#d4b483", citationId: I },
  { id: "transport", label: "Transport", weight: 8.8, yoyPct: 4.43, index: 105.63, href: "/inflation/transport", hatch: "ochre", color: "#e8c547", citationId: I },
  { id: "health", label: "Health", weight: 6.1, yoyPct: 1.34, index: 104.75, href: "/inflation/health", hatch: "zinc", color: "#3dbaa8", citationId: I },
  { id: "clothing", label: "Clothing and footwear", weight: 6.38, yoyPct: 3.38, index: 108.45, href: "/inflation/clothing", hatch: "carbon", color: "#a78bfa", citationId: I },
  { id: "personal", label: "Personal care and miscellaneous", weight: 5.04, yoyPct: 14.77, index: 123.51, href: "/inflation/other", hatch: "rust", color: "#ff7a59", citationId: I },
  { id: "furnishings", label: "Furnishings and household", weight: 4.47, yoyPct: 2.4, index: 105.21, href: "/inflation/other", hatch: "zinc", color: "#8fbc5a", citationId: I },
  { id: "communication", label: "Information and communication", weight: 3.61, yoyPct: 0.63, index: 104.26, href: "/inflation/other", hatch: "ochre", color: "#5b8def", citationId: I },
  { id: "restaurants", label: "Restaurants and accommodation", weight: 3.35, yoyPct: 7.72, index: 112.68, href: "/inflation/other", hatch: "rust", color: "#f0a04b", citationId: I },
  { id: "education", label: "Education", weight: 3.33, yoyPct: 3.64, index: 108.58, href: "/inflation/education", hatch: "carbon", color: "#f2ead8", citationId: I },
  { id: "paan", label: "Paan, tobacco and intoxicants", weight: 2.99, yoyPct: 4.79, index: 108.18, href: "/inflation/other", hatch: "zinc", color: "#c4896a", citationId: I },
  { id: "recreation", label: "Recreation, sport and culture", weight: 1.52, yoyPct: 1.64, index: 104.49, href: "/inflation/other", hatch: "ochre", color: "#6ec9d8", citationId: I },
];

export const WEIGHTS_CITE = W;

export const ROOMS: {
  id: string;
  label: string;
  blurb: string;
  divisionId?: string;
  observed: boolean;
}[] = [
  { id: "food", label: "Food", blurb: "Kitchen rupees from the Price Monitoring Division, beside the food CPI.", divisionId: "food", observed: true },
  { id: "fuel", label: "Fuel", blurb: "Delhi petrol and diesel as printed by PPAC. LPG not typed.", observed: true },
  { id: "health", label: "Health", blurb: "Official CPI Health division. No clinic or medicine rupee is typed.", divisionId: "health", observed: false },
  { id: "housing", label: "Housing", blurb: "Official CPI Housing, water, electricity and gas. No rent rupee is typed.", divisionId: "housing", observed: false },
  { id: "education", label: "Education", blurb: "Official CPI Education services. No fee rupee is typed.", divisionId: "education", observed: false },
  { id: "transport", label: "Transport", blurb: "Official CPI Transport. Petrol sits on the Fuel page as an observed rupee.", divisionId: "transport", observed: false },
  { id: "clothing", label: "Clothing", blurb: "Official CPI Clothing and footwear. No garment rupee is typed.", divisionId: "clothing", observed: false },
  { id: "other", label: "Other divisions", blurb: "Restaurants, communication, furnishings, recreation, paan, personal care.", observed: false },
];

export function getRoom(id: string) {
  return ROOMS.find((r) => r.id === id);
}

export function getDivision(id: string) {
  return CPI_DIVISIONS.find((d) => d.id === id);
}
