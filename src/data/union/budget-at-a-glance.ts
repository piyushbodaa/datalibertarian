import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "union-bag-2026-27";

function fromCrore(crore: number, series: Series, fiscalYear: string): Money {
  return {
    crore,
    rupees: Math.round(crore * 10_000_000),
    series,
    fiscalYear,
    citationId: CITE,
  };
}

function four(actual: number, be25: number, re25: number, be26: number): Money[] {
  return [
    fromCrore(actual, "actual", "2024-25"),
    fromCrore(be25, "be", "2025-26"),
    fromCrore(re25, "re", "2025-26"),
    fromCrore(be26, "be", "2026-27"),
  ];
}

/** Item 9. Total Expenditure — Budget at a Glance, crore as printed. */
export const unionTotalExpenditure: LineItem = {
  id: "union-bag-total",
  plainLabel: "Union total expenditure",
  officialName: "Budget at a Glance — 9. Total Expenditure (10+13)",
  head: "union-total",
  amounts: four(4652867, 5065345, 4964842, 5347315),
};

export const unionRevenueExpenditure: LineItem = {
  id: "union-bag-revenue",
  plainLabel: "Revenue",
  officialName: "Budget at a Glance — 10. On Revenue Account",
  head: "union-total",
  amounts: four(3600914, 3944255, 3869087, 4125494),
};

export const unionCapitalExpenditure: LineItem = {
  id: "union-bag-capital",
  plainLabel: "Capital",
  officialName: "Budget at a Glance — 13. On Capital Account",
  head: "union-total",
  amounts: four(1051953, 1121090, 1095755, 1221821),
};

export const UNION_TOTAL_YEAR = "2026-27";
export const UNION_TOTAL_SERIES: Series = "be";

const DEBT = "union-rec-annex9-2026-27";

/** Receipt Budget Annex 9 — outstanding internal+external debt and other liabilities. Union books only. */
export const unionOutstandingLiabilities: LineItem = {
  id: "union-outstanding-liabilities",
  plainLabel: "Union outstanding liabilities",
  officialName:
    "Receipt Budget 2026-27 Annex 9 — outstanding internal and external debt and other liabilities of the Government of India",
  head: "union-debt",
  amounts: [
    fromCrore(19718016, "re", "2025-26"),
    fromCrore(21482050, "be", "2026-27"),
  ].map((m) => ({ ...m, citationId: DEBT })),
};

export const UNION_DEBT_YEAR = "2026-27";
export const UNION_DEBT_SERIES: Series = "be";
