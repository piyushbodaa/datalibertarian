import type { Money, Series } from "../data/maharashtra-police";

export function fromCrore(
  crore: number,
  series: Series,
  fiscalYear: string,
  citationId: string,
): Money {
  return {
    crore,
    rupees: Math.round(crore * 10_000_000),
    series,
    fiscalYear,
    citationId,
  };
}

export const SERIES_LABEL: Record<Series, string> = {
  actual: "Spent",
  be: "Plan",
  re: "Updated",
};

export const SERIES_PLAIN: Record<Series, string> = {
  actual: "what was spent",
  be: "the plan for the year",
  re: "the updated plan mid-year",
};

export function formatCrore(crore: number): string {
  const rounded = Math.round(crore * 100) / 100;
  const [int, frac] = rounded.toFixed(2).split(".");
  const whole = Number(int).toLocaleString("en-IN");
  if (frac === "00") return whole;
  return `${whole}.${frac}`;
}

export function formatRupeeLine(m: Money): string {
  return `₹${m.rupees.toLocaleString("en-IN")}`;
}

export function formatMoneyShort(m: Money): string {
  if (m.crore > 0 && m.crore < 1) {
    const lakh = Math.round(m.crore * 10000) / 100;
    return `₹${lakh.toLocaleString("en-IN")} lakh`;
  }
  return `₹${formatCrore(m.crore)} crore`;
}

export function seriesYearLabel(m: Money): string {
  return `${SERIES_LABEL[m.series]} ${m.fiscalYear}`;
}

/** White Book print order — mixed series, not one trend. */
export const BOOK_COLUMNS: { fiscalYear: string; series: Series }[] = [
  { fiscalYear: "2024-25", series: "actual" },
  { fiscalYear: "2025-26", series: "be" },
  { fiscalYear: "2025-26", series: "re" },
  { fiscalYear: "2026-27", series: "be" },
];
