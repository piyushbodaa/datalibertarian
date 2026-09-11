import type { InflationItem, PricePoint } from "./types";

function parseDay(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function latest(points: PricePoint[]): PricePoint | undefined {
  if (points.length === 0) return undefined;
  return [...points].sort((a, b) => parseDay(b.asOf) - parseDay(a.asOf))[0];
}

export function pointOn(points: PricePoint[], asOf: string): PricePoint | undefined {
  return points.find((p) => p.asOf === asOf);
}

/** Percent change from two cited prices. Missing or non-positive then → undefined, never 0. */
export function pctChange(now: PricePoint | undefined, then: PricePoint | undefined): number | undefined {
  if (!now || !then) return undefined;
  if (!(then.rupees > 0) || !(now.rupees > 0)) return undefined;
  if (now.unit !== then.unit) return undefined;
  return (now.rupees / then.rupees - 1) * 100;
}

export function yoyOf(item: InflationItem): number | undefined {
  const now = latest(item.observed);
  if (!now) return undefined;
  const then = item.observed.find((p) => p.asOf === yearAgo(now.asOf));
  return pctChange(now, then);
}

export function momOf(item: InflationItem): number | undefined {
  const now = latest(item.observed);
  if (!now) return undefined;
  const then = item.observed.find((p) => p.asOf === monthAgo(now.asOf));
  return pctChange(now, then);
}

export function yearAgo(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y - 1}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function monthAgo(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() - 1);
  return dt.toISOString().slice(0, 10);
}

export function formatPct(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const abs = Math.abs(rounded).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${abs}%`;
}

export function formatPrice(p: PricePoint): string {
  const n = p.rupees.toLocaleString("en-IN", {
    minimumFractionDigits: p.rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `₹${n} / ${p.unit}`;
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

export function yearPair(item: InflationItem): { now: PricePoint; then: PricePoint } | undefined {
  const now = latest(item.observed);
  if (!now) return undefined;
  const then = item.observed.find((p) => p.asOf === yearAgo(now.asOf));
  if (!then) return undefined;
  return { now, then };
}

/** Never a bare percent: names both rupees and both dates. */
export function formatFromTo(then: PricePoint, now: PricePoint): string {
  const pct = pctChange(now, then);
  const delta = now.rupees - then.rupees;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const abs = Math.abs(delta).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const change = pct === undefined ? "" : ` · ${formatPct(pct)} in 12 months`;
  return `${formatPrice(then)} on ${formatDay(then.asOf)} → ${formatPrice(now)} on ${formatDay(now.asOf)} (${sign}₹${abs} / ${now.unit}${change})`;
}
