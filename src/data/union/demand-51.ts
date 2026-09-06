import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "union-sbe51-2026-27";
const MHA = "union-sumsbe-2026-27";

function fromCrore(crore: number, series: Series, fiscalYear: string, citationId = CITE): Money {
  return {
    crore,
    rupees: Math.round(crore * 10_000_000),
    series,
    fiscalYear,
    citationId,
  };
}

function four(actual2425: number, be2526: number, re2526: number, be2627: number, citationId = CITE): Money[] {
  return [
    fromCrore(actual2425, "actual", "2024-25", citationId),
    fromCrore(be2526, "be", "2025-26", citationId),
    fromCrore(re2526, "re", "2025-26", citationId),
    fromCrore(be2627, "be", "2026-27", citationId),
  ];
}

/** Demand 51 net Grand Total — Notes on Demands, p. 176 */
export const demand51Net: LineItem = {
  id: "union-51-net",
  plainLabel: "Union Demand 51 — Police (net)",
  officialName: "Demand No. 51 Police — Grand Total (net of recoveries)",
  head: "union-51",
  amounts: four(146634.82, 160391.06, 162283.39, 173802.53),
};

export const demand51Revenue: LineItem = {
  id: "union-51-revenue",
  plainLabel: "Revenue",
  officialName: "Demand No. 51 Police — Revenue (net)",
  head: "union-51",
  amounts: four(135073.72, 143811.87, 146262.78, 152530.06),
};

export const demand51Capital: LineItem = {
  id: "union-51-capital",
  plainLabel: "Capital",
  officialName: "Demand No. 51 Police — Capital (net)",
  head: "union-51",
  amounts: four(11561.1, 16579.19, 16020.61, 21272.47),
};

/** Major printed groups — totals as in sbe51.pdf */
export const demand51Groups: LineItem[] = [
  {
    id: "capf",
    plainLabel: "Central Armed Police Forces",
    officialName: "1. Total — Central Armed Police Forces",
    head: "union-51",
    amounts: four(104824.1, 109037.05, 112636.16, 116789.3),
  },
  {
    id: "delhi-police",
    plainLabel: "Delhi Police",
    officialName: "5. Delhi Police",
    head: "union-51",
    amounts: four(12133.16, 11931.66, 12405.7, 12503.65),
  },
  {
    id: "jk-police",
    plainLabel: "Jammu and Kashmir Police",
    officialName: "6. Jammu & Kashmir Police",
    head: "union-51",
    amounts: four(8553.38, 9325.73, 9097.44, 9925.5),
  },
  {
    id: "ib",
    plainLabel: "Intelligence Bureau",
    officialName: "2. Intelligence Bureau",
    head: "union-51",
    amounts: four(4013.19, 3893.35, 4159.11, 6782.43),
  },
  {
    id: "border-infra",
    plainLabel: "Border infrastructure and management",
    officialName: "13. Total — Border Infrastructure and Management",
    head: "union-51",
    amounts: four(3953.84, 5597.25, 5472.31, 5576.51),
  },
  {
    id: "police-infra",
    plainLabel: "Police infrastructure",
    officialName: "14. Total — Police Infrastructure",
    head: "union-51",
    amounts: four(2133.18, 4379.2, 3684.23, 5393.37),
  },
];

/** Ministry of Home Affairs (all demands) — SBE summary, BE 2026-27 only. Not police-only. */
export const mhaTotalBe2627: Money = fromCrore(255233.53, "be", "2026-27", MHA);

export const UNION_HEADLINE_YEAR = "2026-27";
export const UNION_HEADLINE_SERIES: Series = "be";
