import type { LineItem, Money, Series } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";
import type { MissingYear } from "../telangana/commissionerates";

export type MunicipalSlug = "ghmc" | "bmc";

export type MunicipalBody = {
  slug: MunicipalSlug;
  name: string;
  body: string;
  state: string;
  stateSlug: string;
  tier: "gold" | "empty";
  /** Revenue + capital expenditure as printed. */
  total?: LineItem;
  revenue?: LineItem;
  capital?: LineItem;
  missingYears: MissingYear[];
  citationId?: string;
  nextSearch?: string;
};

const CITE = "ghmc-be-2025-26";

/** GHMC prints ₹ in crore. Budget Highlights, printed page 27, table A. */
function crore(c: number, series: Series, fiscalYear: string): Money {
  return fromCrore(c, series, fiscalYear, CITE);
}

export const ghmcRevenue: LineItem = {
  id: "ghmc-revenue",
  plainLabel: "Running the city (revenue expenditure)",
  officialName: "Revenue Expenditure — GHMC Budget Highlights table A",
  head: "civic-revenue",
  amounts: [
    crore(2896.9, "actual", "2023-24"),
    crore(3458, "be", "2024-25"),
    crore(3874, "re", "2024-25"),
    crore(4000, "be", "2025-26"),
  ],
};

export const ghmcCapital: LineItem = {
  id: "ghmc-capital",
  plainLabel: "Building the city (capital expenditure)",
  officialName: "Capital Expenditure — GHMC Budget Highlights table A",
  head: "civic-capital",
  amounts: [
    crore(4223.8, "actual", "2023-24"),
    crore(4479, "be", "2024-25"),
    crore(4244, "re", "2024-25"),
    crore(4440, "be", "2025-26"),
  ],
};

/**
 * Printed "Budget Size (RE + CE)". The estimate columns equal revenue + capital.
 * The 2023-24 actual is printed as 7,119.00 while its two parts add to 7,120.70 —
 * the printed total is kept, and the mismatch is noted in the citation.
 */
export const ghmcTotal: LineItem = {
  id: "ghmc-total",
  plainLabel: "GHMC budget size",
  officialName: "Budget Size (RE + CE) — GHMC Budget Highlights table A",
  head: "civic-total",
  amounts: [
    crore(7119, "actual", "2023-24"),
    crore(7937, "be", "2024-25"),
    crore(8118, "re", "2024-25"),
    crore(8440, "be", "2025-26"),
  ],
};

const BMC = "bmc-be-2026-27";

/** BMC Budget Estimates 2026-27 "at a glance", printed p. 5 — Overall Size of Budget A, B, E, G & Tree Authority. Rs in crore. */
export const bmcRevenue: LineItem = {
  id: "bmc-revenue",
  plainLabel: "Running the city (revenue expenditure)",
  officialName: "Revenue Expenditure — BMC Budget Estimates 2026-27, Overall Size of Budget (Net)",
  head: "civic-revenue",
  amounts: [fromCrore(32698.44, "be", "2026-27", BMC)],
};

export const bmcCapital: LineItem = {
  id: "bmc-capital",
  plainLabel: "Building the city (capital expenditure)",
  officialName: "Capital Expenditure — BMC Budget Estimates 2026-27, Overall Size of Budget (Net)",
  head: "civic-capital",
  amounts: [fromCrore(48164.28, "be", "2026-27", BMC)],
};

/** Printed "Total" expenditure = revenue + capital. The printed "Total Size of Budget" (80,952.56) adds 89.84 crore of excess income and is not the spend. */
export const bmcTotal: LineItem = {
  id: "bmc-total",
  plainLabel: "BMC total expenditure",
  officialName: "Total expenditure (revenue + capital) — BMC Budget Estimates 2026-27, Overall Size of Budget",
  head: "civic-total",
  amounts: [fromCrore(80862.72, "be", "2026-27", BMC)],
};

export const municipalBodies: MunicipalBody[] = [
  {
    slug: "ghmc",
    name: "GHMC (Hyderabad)",
    body: "Greater Hyderabad Municipal Corporation",
    state: "Telangana",
    stateSlug: "telangana",
    tier: "gold",
    total: ghmcTotal,
    revenue: ghmcRevenue,
    capital: ghmcCapital,
    citationId: CITE,
    missingYears: [
      {
        fiscalYear: "2026-27",
        reason:
          "The council-approved 2026-27 budget is reported in the press but no book is on ghmc.gov.in/ghmcbuget.aspx as of 14 September 2026. A newspaper number is not a book number.",
      },
    ],
  },
  {
    slug: "bmc",
    name: "BMC (Mumbai)",
    body: "Brihanmumbai Municipal Corporation",
    state: "Maharashtra",
    stateSlug: "maharashtra",
    tier: "gold",
    total: bmcTotal,
    revenue: bmcRevenue,
    capital: bmcCapital,
    citationId: BMC,
    missingYears: [
      {
        fiscalYear: "2025-26",
        reason:
          "The 2026-27 at-a-glance summary prints only the 2026-27 column. Earlier years sit in the 2025-26 book, which is not typed yet. Not printed as zero.",
      },
    ],
  },
];

export function getMunicipalBody(slug: string): MunicipalBody | undefined {
  return municipalBodies.find((m) => m.slug === slug);
}

/** Latest printed Budget column — never a filled-in missing year. */
export function municipalHero(body: MunicipalBody): Money {
  const bes = body.total?.amounts.filter((a) => a.series === "be") ?? [];
  const latest = bes.sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear))[0];
  if (!latest) throw new Error(`No printed BE for ${body.slug}`);
  return latest;
}

export const GHMC_HEADLINE_YEAR = "2025-26";
export const GHMC_HEADLINE_SERIES: Series = "be";
