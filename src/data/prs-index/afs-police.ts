import type { LineItem } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

/** PRS AFS Police functional, 2025-26 BE only — phase1 rank. Not White Book. */
export const INDEX_YEAR = "2025-26";
export const INDEX_SERIES = "be" as const;

type Row = {
  slug: string;
  name: string;
  be2526: number;
  cite: string;
};

/** Exact 2025-26 BE crore from phase1-state-totals.md rank. No other years invented. */
export const INDEX_ROWS: Row[] = [
  { slug: "uttar-pradesh", name: "Uttar Pradesh", be2526: 38777, cite: "prs-uttar-pradesh" },
  { slug: "maharashtra", name: "Maharashtra", be2526: 33743, cite: "prs-maharashtra" },
  { slug: "bihar", name: "Bihar", be2526: 14653, cite: "prs-bihar" },
  { slug: "tamil-nadu", name: "Tamil Nadu", be2526: 12714, cite: "prs-tamil-nadu" },
  { slug: "west-bengal", name: "West Bengal", be2526: 12281, cite: "prs-west-bengal" },
  { slug: "madhya-pradesh", name: "Madhya Pradesh", be2526: 12197, cite: "prs-madhya-pradesh" },
  { slug: "karnataka", name: "Karnataka", be2526: 11461, cite: "prs-karnataka" },
  { slug: "rajasthan", name: "Rajasthan", be2526: 11125, cite: "prs-rajasthan" },
  { slug: "gujarat", name: "Gujarat", be2526: 10029, cite: "prs-gujarat" },
  { slug: "telangana", name: "Telangana Police", be2526: 9641, cite: "prs-telangana" },
  { slug: "punjab", name: "Punjab", be2526: 9269, cite: "prs-punjab" },
  { slug: "chhattisgarh", name: "Chhattisgarh", be2526: 7897, cite: "prs-chhattisgarh" },
  { slug: "haryana", name: "Haryana", be2526: 7588, cite: "prs-haryana" },
  { slug: "jharkhand", name: "Jharkhand", be2526: 7396, cite: "prs-jharkhand" },
  { slug: "assam", name: "Assam", be2526: 7170, cite: "prs-assam" },
  { slug: "odisha", name: "Odisha", be2526: 6831, cite: "prs-odisha" },
  { slug: "kerala", name: "Kerala", be2526: 5098, cite: "prs-kerala" },
  { slug: "manipur", name: "Manipur", be2526: 3209, cite: "prs-manipur" },
  { slug: "arunachal-pradesh", name: "Arunachal Pradesh", be2526: 3075, cite: "prs-arunachal-pradesh" },
  { slug: "uttarakhand", name: "Uttarakhand", be2526: 2856, cite: "prs-uttarakhand" },
  { slug: "tripura", name: "Tripura", be2526: 2297, cite: "prs-tripura" },
  { slug: "nagaland", name: "Nagaland", be2526: 1987, cite: "prs-nagaland" },
  { slug: "himachal-pradesh", name: "Himachal Pradesh", be2526: 1643, cite: "prs-himachal-pradesh" },
  { slug: "meghalaya", name: "Meghalaya", be2526: 1392, cite: "prs-meghalaya" },
  { slug: "goa", name: "Goa", be2526: 1042, cite: "prs-goa" },
  { slug: "mizoram", name: "Mizoram", be2526: 753, cite: "prs-mizoram" },
  { slug: "sikkim", name: "Sikkim", be2526: 633, cite: "prs-sikkim" },
];

export const indexPoliceLines: LineItem[] = INDEX_ROWS.map((r) => ({
  id: `index-${r.slug}`,
  plainLabel: r.name,
  officialName: `PRS AFS Police functional — ${r.name}`,
  head: "index",
  amounts: [fromCrore(r.be2526, "be", INDEX_YEAR, r.cite)],
}));

export const indexTotalBe2526 = INDEX_ROWS.reduce((s, r) => s + r.be2526, 0);

export function getIndexRow(slug: string): Row | undefined {
  return INDEX_ROWS.find((r) => r.slug === slug);
}

export function getIndexLine(slug: string): LineItem | undefined {
  return indexPoliceLines.find((l) => l.id === `index-${slug}`);
}

/** Last found PRS AFS Police figures for Andhra Pradesh. Later years are percent of spend — not converted. */
export const apLastFound = {
  be2425: fromCrore(7874, "be", "2024-25", "prs-andhra-pradesh"),
  actual2425: fromCrore(7695, "actual", "2024-25", "prs-andhra-pradesh"),
};
