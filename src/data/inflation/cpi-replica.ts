/** CPI 2024 calculation primitives. These do not create missing observations or certify a sampling frame. */
export type Sector = "rural" | "urban";
export type IndexSector = Sector | "combined";
export interface PriceQuotation {
  period: string; // YYYY-MM, not a daily spot observation
  rupees: number;
  unit: string;
  quantity: number;
  specificationId: string;
  outletId: string;
  source: string;
}
export interface MatchedQuotation {
  id: string;
  previous: PriceQuotation | null;
  current: PriceQuotation | null;
  temporaryMissing?: boolean;
}
export interface JevonsInput {
  itemId: string;
  state: string;
  sector: Sector;
  period: string;
  previousPeriod: string;
  previousIndex: number | null;
  expectedQuoteIds: readonly string[];
  quotations: readonly MatchedQuotation[];
  // A documented movement of a comparable higher aggregate; never default to 1.
  higherAggregateMovement?: { factor: number; source: string };
  // Only valid for an administered item with evidence that no revision took effect.
  administeredUnchanged?: { source: string };
}
export interface JevonsResult {
  status: "complete" | "incomplete" | "invalid";
  index: number | null;
  link: number | null;
  observedCount: number;
  imputedCount: number;
  expectedCount: number;
  relatives: { id: string; relative: number; treatment: "observed" | "within-item-imputation" | "aggregate-imputation" | "administered-carry-forward"; source: string }[];
  issues: string[];
}
const positive = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const monthNumber = (period: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return NaN;
  const [year, month] = period.split("-").map(Number);
  return year * 12 + month - 1;
};
const validQuote = (q: PriceQuotation | null, period: string): q is PriceQuotation => !!q && q.period === period && positive(q.rupees) && positive(q.quantity) && !!q.unit.trim() && !!q.specificationId.trim() && !!q.outletId.trim() && !!q.source.trim();
const sameSpecification = (a: PriceQuotation, b: PriceQuotation) => a.specificationId === b.specificationId && a.outletId === b.outletId && a.unit === b.unit && a.quantity === b.quantity;
export function geometricMean(values: readonly number[]): number | null {
  if (!values.length || values.some(v => !positive(v))) return null;
  const result = Math.exp(values.reduce((sum, v) => sum + Math.log(v) / values.length, 0));
  return positive(result) ? result : null;
}
/** MoSPI expert report §§4.6.1, 4.6.4–4.6.6. Missing quotes stay in the fixed panel. */
export function compileJevonsLink(input: JevonsInput): JevonsResult {
  const out: JevonsResult = { status: "invalid", index: null, link: null, observedCount: 0, imputedCount: 0, expectedCount: input.expectedQuoteIds.length, relatives: [], issues: [] };
  const expected = new Set(input.expectedQuoteIds);
  const seen = new Set(input.quotations.map(q => q.id));
  if (!input.itemId || !input.state || !["rural", "urban"].includes(input.sector)) out.issues.push("A priced item, state and rural/urban sector are required.");
  if (!Number.isFinite(monthNumber(input.period)) || monthNumber(input.period) - monthNumber(input.previousPeriod) !== 1) out.issues.push("Prices must refer to consecutive reference months.");
  if (!expected.size || expected.size !== input.expectedQuoteIds.length || expected.has("")) out.issues.push("Expected quotation IDs must be nonempty and unique.");
  if (seen.size !== input.quotations.length || [...seen].some(id => !expected.has(id))) out.issues.push("Duplicate or unexpected quotation IDs.");
  if (input.higherAggregateMovement && (!positive(input.higherAggregateMovement.factor) || !input.higherAggregateMovement.source.trim())) out.issues.push("An imputation factor requires a positive value and documented donor source.");
  if (input.administeredUnchanged && !input.administeredUnchanged.source.trim()) out.issues.push("Carry-forward requires evidence of an unchanged administered price.");
  if (out.issues.length) return out;
  const missing: MatchedQuotation[] = [];
  for (const id of expected) {
    const pair = input.quotations.find(q => q.id === id);
    if (!pair || !validQuote(pair.previous, input.previousPeriod)) { out.issues.push(`${id}: valid previous-month price evidence unavailable.`); continue; }
    if (validQuote(pair.current, input.period)) {
      if (!sameSpecification(pair.previous, pair.current)) { out.issues.push(`${id}: outlet, specification, unit or pack size changed without a matched overlap pair.`); continue; }
      const relative = pair.current.rupees / pair.previous.rupees;
      if (!positive(relative)) { out.issues.push(`${id}: non-finite price relative.`); continue; }
      out.relatives.push({ id, relative, treatment: "observed", source: pair.current.source });
      out.observedCount++;
    } else if (pair.current === null && pair.temporaryMissing) missing.push(pair);
    else out.issues.push(`${id}: missing, invalid or wrongly dated current price; no reviewed temporary-missing treatment.`);
  }
  const donor = geometricMean(out.relatives.map(r => r.relative));
  for (const pair of missing) {
    // Administered carry-forward is explicit and never inferred from absence of data.
    const treatment = input.administeredUnchanged ? "administered-carry-forward" : donor !== null ? "within-item-imputation" : input.higherAggregateMovement ? "aggregate-imputation" : null;
    const factor = input.administeredUnchanged ? 1 : donor ?? input.higherAggregateMovement?.factor;
    if (!treatment || !positive(factor)) { out.issues.push(`${pair.id}: no eligible donor movement for imputation.`); continue; }
    out.relatives.push({ id: pair.id, relative: factor, treatment, source: input.administeredUnchanged?.source ?? (donor !== null ? "Observed relatives in this state × sector × priced-item panel" : input.higherAggregateMovement!.source) });
    out.imputedCount++;
  }
  if (!positive(input.previousIndex)) out.issues.push("Previous-month index and its anchored chain are required; do not assume 100.");
  if (out.issues.length || out.relatives.length !== expected.size) { out.status = "incomplete"; return out; }
  const link = geometricMean(out.relatives.map(r => r.relative));
  const index = link === null ? null : link * input.previousIndex!;
  if (!positive(index)) { out.issues.push("Compiled index is non-finite."); return out; }
  out.status = "complete"; out.link = link; out.index = index;
  return out;
}

export interface WeightedIndex {
  id: string;
  weight: number;
  currentIndex: number | null;
  yearAgoIndex: number | null;
}
export interface YoungResult {
  status: "complete" | "incomplete" | "invalid";
  currentIndex: number | null;
  yearAgoIndex: number | null;
  yoyPct: number | null;
  totalWeight: number;
  currentCoveragePct: number;
  annualCoveragePct: number;
  missingCurrentIds: string[];
  missingAnnualIds: string[];
  issues: string[];
}
/** MoSPI §4.6.2: fixed expenditure-weight arithmetic mean of CHILD INDEX LEVELS. */
export function aggregateYoung(children: readonly WeightedIndex[]): YoungResult {
  const out: YoungResult = { status: "invalid", currentIndex: null, yearAgoIndex: null, yoyPct: null, totalWeight: 0, currentCoveragePct: 0, annualCoveragePct: 0, missingCurrentIds: [], missingAnnualIds: [], issues: [] };
  if (!children.length || new Set(children.map(r => r.id)).size !== children.length || children.some(r => !r.id || !Number.isFinite(r.weight) || r.weight < 0)) { out.issues.push("Unique child IDs and finite non-negative weights are required."); return out; }
  const active = children.filter(r => r.weight > 0);
  out.totalWeight = active.reduce((sum, r) => sum + r.weight, 0);
  if (!positive(out.totalWeight)) { out.issues.push("Positive total expenditure weight is required."); return out; }
  const current = active.filter(r => positive(r.currentIndex));
  const annual = active.filter(r => positive(r.currentIndex) && positive(r.yearAgoIndex));
  out.currentCoveragePct = current.reduce((sum,r) => sum + r.weight,0) / out.totalWeight * 100;
  out.annualCoveragePct = annual.reduce((sum,r) => sum + r.weight,0) / out.totalWeight * 100;
  out.missingCurrentIds = active.filter(r => !positive(r.currentIndex)).map(r => r.id);
  out.missingAnnualIds = active.filter(r => !positive(r.currentIndex) || !positive(r.yearAgoIndex)).map(r => r.id);
  if (!out.missingCurrentIds.length) out.currentIndex = active.reduce((sum,r) => sum + (r.weight / out.totalWeight) * r.currentIndex!,0);
  if (!active.some(r => !positive(r.yearAgoIndex))) out.yearAgoIndex = active.reduce((sum,r) => sum + (r.weight / out.totalWeight) * r.yearAgoIndex!,0);
  if (out.currentIndex !== null && out.yearAgoIndex !== null) out.yoyPct = (out.currentIndex / out.yearAgoIndex - 1) * 100;
  if ([out.currentIndex, out.yearAgoIndex, out.yoyPct].some(v => v !== null && !Number.isFinite(v))) { out.currentIndex=out.yearAgoIndex=out.yoyPct=null;out.issues.push("Compiled aggregate is non-finite.");return out; }
  out.status = out.missingAnnualIds.length ? "incomplete" : "complete";
  return out;
}

export interface BasketWeightItem { id: string; weights: Record<IndexSector, number> }
/** Evidence must describe a completed aggregation over the required state×sector panels, not a shop quote. */
export interface ReplicaItemEvidence {
  itemId: string;
  sector: IndexSector;
  period: string;
  yearAgoPeriod: string;
  baseYear: number;
  currentIndex: number | null;
  yearAgoIndex: number | null;
  origin: "independent-price-panel" | "official-index" | "spot-price";
  stateSectorCoverageComplete: boolean;
  specialistWeightsComplete: boolean;
  chainAnchoredToBase: boolean;
  evidenceSources: readonly string[];
}
export interface ReplicaAudit extends YoungResult {
  eligibleItemCount: number;
  totalItemCount: number;
  rejectedEvidence: { itemId: string; reason: string }[];
}
/** Full-basket publication gate. It does not assert a new panel is statistically more accurate. */
export function auditReplicaCoverage(basket: readonly BasketWeightItem[], evidence: readonly ReplicaItemEvidence[], period: string, sector: IndexSector = "combined"): ReplicaAudit {
  const rejectedEvidence: ReplicaAudit["rejectedEvidence"] = [];
  const ids = new Set(basket.map(item => item.id));
  const requestIssues: string[] = [];
  if (!Number.isFinite(monthNumber(period))) requestIssues.push("A valid target reference month is required.");
  if (!["rural", "urban", "combined"].includes(sector)) requestIssues.push("A valid CPI sector is required.");
  if (basket.length !== 358 || ids.size !== 358) requestIssues.push("The CPI 2024 publication gate requires all 358 unique basket items, including items with no evidence.");
  if (basket.some(item => !item.id.trim() || !Number.isFinite(item.weights[sector]) || item.weights[sector] < 0)) requestIssues.push("Basket IDs and finite, non-negative official expenditure weights are required.");
  const totalWeight = basket.reduce((sum, item) => sum + item.weights[sector], 0);
  if (!Number.isFinite(totalWeight) || Math.abs(totalWeight - 100) > 0.000001) requestIssues.push("The complete sector's official expenditure weights must sum to 100%.");
  if (requestIssues.length) {
    const empty = aggregateYoung(basket.map(item => ({
      id: item.id, weight: item.weights[sector], currentIndex: null, yearAgoIndex: null,
    })));
    return {
      ...empty, status: "invalid", currentIndex: null, yearAgoIndex: null, yoyPct: null,
      eligibleItemCount: 0, totalItemCount: basket.filter(item => item.weights[sector] > 0).length,
      rejectedEvidence: [], issues: [...empty.issues, ...requestIssues],
    };
  }
  const previousYearPeriod = `${Number(period.slice(0, 4)) - 1}${period.slice(4)}`;
  const accepted = new Map<string, ReplicaItemEvidence>();
  const seen = new Set<string>();
  for (const record of evidence.filter(e => e.sector === sector)) {
    const duplicate = seen.has(record.itemId);
    seen.add(record.itemId);
    const reason = duplicate ? "Duplicate evidence for an item and sector"
      : !ids.has(record.itemId) ? "Item outside the published basket"
      : record.origin !== "independent-price-panel" ? "Official indices and spot prices do not establish independent CPI replication"
      : record.period !== period || record.yearAgoPeriod !== previousYearPeriod || record.baseYear !== 2024 ? "Period or price-base mismatch"
      : record.stateSectorCoverageComplete !== true || record.specialistWeightsComplete !== true || record.chainAnchoredToBase !== true ? "Panel coverage, specialist weights or anchored monthly chain incomplete"
      : !record.evidenceSources.length || record.evidenceSources.some(s => !s.trim()) ? "Missing evidence trail"
      : !positive(record.currentIndex) || !positive(record.yearAgoIndex) ? "Missing independently compiled index levels"
      : "";
    if (reason) {
      rejectedEvidence.push({ itemId: record.itemId, reason });
      // Once duplicated, the item's evidence stays rejected, even on a third record.
      if (duplicate) accepted.delete(record.itemId);
    } else accepted.set(record.itemId, record);
  }
  const result = aggregateYoung(basket.map(item => ({
    id: item.id, weight: item.weights[sector],
    currentIndex: accepted.get(item.id)?.currentIndex ?? null,
    yearAgoIndex: accepted.get(item.id)?.yearAgoIndex ?? null,
  })));
  return {
    ...result,
    eligibleItemCount: basket.filter(item => item.weights[sector] > 0 && accepted.has(item.id)).length,
    totalItemCount: basket.filter(item => item.weights[sector] > 0).length,
    rejectedEvidence,
  };
}
