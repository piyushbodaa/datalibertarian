/** A transparent essentials basket, not an estimate of national all-items CPI. */
export interface PrivatePriceRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  current: number | null;
  monthAgo: number | null;
  yearAgo: number | null;
}

export type BaseSpending = Readonly<Record<string, number>>;
export interface BasketContribution {
  id: string;
  baseSpend: number;
  weightPct: number;
  quantity: number | null;
  yoyPct: number | null;
  contributionPp: number | null;
  currentCost: number | null;
  monthCost: number | null;
}

export interface BasketResult {
  status: "ok" | "empty" | "invalid" | "incomplete";
  index: number | null;
  yoyPct: number | null;
  momPct: number | null;
  baseCost: number | null;
  currentCost: number | null;
  monthCost: number | null;
  contributions: BasketContribution[];
  coverage: { selectedCount: number; matchedCount: number; weightPct: number };
  excludedIds: string[];
  missingIds: string[];
  missingMonthIds: string[];
  errors: string[];
}

export const INDEX_VERSION = "DL-E22-v1";
export const DEFAULT_BASE_SPEND = 100;
export const PUBLISHED_BASE_DATE = "2025-11-16";
export const PUBLISHED_ITEM_IDS = [
  "rice",
  "wheat",
  "atta",
  "gram-dal",
  "tur-dal",
  "urad-dal",
  "moong-dal",
  "masoor-dal",
  "groundnut-oil",
  "mustard-oil",
  "vanaspati",
  "soya-oil",
  "sunflower-oil",
  "palm-oil",
  "potato",
  "onion",
  "tomato",
  "sugar",
  "gur",
  "milk",
  "tea",
  "salt",
] as const;

const isPrice = (n: number | null): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * Fixed quantities q_i = baseSpend_i / yearAgoPrice_i.
 * I_t = 100 sum(q_i p_it) / sum(baseSpend_i). The default is equal BASE
 * expenditure, not equal quantities or an average of rupee prices. The month
 * comparison costs those same quantities in both months. No missing selected
 * annual price is dropped, imputed, or silently reweighted.
 */
export function calculateBasket(
  rows: readonly PrivatePriceRow[],
  spending?: BaseSpending,
): BasketResult {
  const result: BasketResult = {
    status: "invalid",
    index: null,
    yoyPct: null,
    momPct: null,
    baseCost: null,
    currentCost: null,
    monthCost: null,
    contributions: [],
    coverage: { selectedCount: 0, matchedCount: 0, weightPct: 0 },
    excludedIds: [],
    missingIds: [],
    missingMonthIds: [],
    errors: [],
  };
  const ids = new Set(rows.map((row) => row.id));
  if (ids.size !== rows.length || rows.some((row) => !row.id))
    result.errors.push("Item IDs must be non-empty and unique.");
  if (spending) {
    for (const id of Object.keys(spending))
      if (!ids.has(id)) result.errors.push(`Unknown item weight: ${id}.`);
  }
  const weighted = rows.map((row) => ({
    row,
    spend: spending ? spending[row.id] : DEFAULT_BASE_SPEND,
  }));
  for (const { row, spend } of weighted) {
    if (typeof spend !== "number" || !Number.isFinite(spend) || spend < 0)
      result.errors.push(`Invalid base spending for ${row.id}.`);
  }
  if (result.errors.length) return result;
  const total = weighted.reduce((sum, item) => sum + item.spend, 0);
  if (!Number.isFinite(total)) {
    result.errors.push("Total base spending is too large.");
    return result;
  }
  result.baseCost = total;
  result.excludedIds = weighted
    .filter((item) => item.spend === 0)
    .map((item) => item.row.id);
  const selected = weighted.filter((item) => item.spend > 0);
  result.coverage.selectedCount = selected.length;
  if (total === 0) {
    result.status = "empty";
    return result;
  }
  let matchedSpend = 0;
  for (const { row, spend } of selected) {
    const baseValid = isPrice(row.yearAgo);
    const currentValid = isPrice(row.current);
    const monthValid = isPrice(row.monthAgo);
    const annualValid = baseValid && currentValid;
    if (!annualValid) result.missingIds.push(row.id);
    if (!baseValid || !monthValid) result.missingMonthIds.push(row.id);
    if (annualValid) {
      result.coverage.matchedCount += 1;
      matchedSpend += spend;
    }
    const quantity = baseValid ? spend / row.yearAgo! : null;
    const currentCost =
      quantity !== null && currentValid ? quantity * row.current! : null;
    const monthCost =
      quantity !== null && monthValid ? quantity * row.monthAgo! : null;
    const yoyPct = annualValid ? (row.current! / row.yearAgo! - 1) * 100 : null;
    const contributionPp = yoyPct !== null ? (spend / total) * yoyPct : null;
    result.contributions.push({
      id: row.id,
      baseSpend: spend,
      weightPct: (spend / total) * 100,
      quantity,
      yoyPct,
      contributionPp,
      currentCost,
      monthCost,
    });
  }
  result.coverage.weightPct = (matchedSpend / total) * 100;
  const arithmetic = result.contributions.flatMap((row) => [
    row.quantity,
    row.currentCost,
    row.monthCost,
    row.yoyPct,
    row.contributionPp,
  ]);
  if (arithmetic.some((value) => value !== null && !Number.isFinite(value))) {
    result.errors.push(
      "Prices or spending exceed the supported numeric range.",
    );
    result.contributions = [];
    return result;
  }
  result.status = result.missingIds.length ? "incomplete" : "ok";
  if (!result.missingIds.length) {
    result.currentCost = result.contributions.reduce(
      (sum, row) => sum + row.currentCost!,
      0,
    );
    result.index = (result.currentCost / total) * 100;
    result.yoyPct = result.index - 100;
  }
  if (!result.missingMonthIds.length)
    result.monthCost = result.contributions.reduce(
      (sum, row) => sum + row.monthCost!,
      0,
    );
  if (result.currentCost !== null && result.monthCost !== null)
    result.momPct = (result.currentCost / result.monthCost - 1) * 100;
  if (
    [
      result.index,
      result.yoyPct,
      result.currentCost,
      result.monthCost,
      result.momPct,
    ].some((value) => value !== null && !Number.isFinite(value))
  ) {
    result.status = "invalid";
    result.errors.push("Basket totals exceed the supported numeric range.");
    result.index =
      result.yoyPct =
      result.currentCost =
      result.monthCost =
      result.momPct =
        null;
  }
  return result;
}
