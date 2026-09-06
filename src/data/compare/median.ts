import type { Money, Series } from "../maharashtra-police";
import { EXTRACT_DATE, registerCitation } from "../sources";
import type { CompareFieldId, CompareGrain } from "./fields";
import type { LayerId } from "../layers";

export type PeerHit = {
  slug: string;
  label: string;
  href: string;
  money: Money;
};

export type MedianCell = {
  fieldId: CompareFieldId;
  layer: LayerId | "city" | "station";
  series: Series;
  fiscalYear: string;
  n: number;
  peers: PeerHit[];
  money: Money;
  meanCrore: number;
  method: "single" | "mid-pair";
  midSlugs: string[];
  excludePicked: boolean;
  thin: boolean;
};

export function medianOf(
  peersIn: PeerHit[],
  meta: {
    fieldId: CompareFieldId;
    layer: LayerId | "city" | "station";
    series: Series;
    fiscalYear: string;
    excludePicked: boolean;
  },
): MedianCell | null {
  const peers = [...peersIn].sort((a, b) => a.money.rupees - b.money.rupees);
  if (peers.length === 0) return null;
  const n = peers.length;
  const mid = Math.floor((n - 1) / 2);
  let rupees: number;
  let method: MedianCell["method"];
  let midSlugs: string[];
  if (n % 2 === 1) {
    rupees = peers[mid].money.rupees;
    method = "single";
    midSlugs = [peers[mid].slug];
  } else {
    const a = peers[n / 2 - 1];
    const b = peers[n / 2];
    rupees = Math.round((a.money.rupees + b.money.rupees) / 2);
    method = "mid-pair";
    midSlugs = [a.slug, b.slug];
  }
  const meanCrore = peers.reduce((s, p) => s + p.money.crore, 0) / n;
  const citationId = `desk-median-${meta.layer}-${meta.fieldId}-${meta.series}-${meta.fiscalYear}`;
  registerCitation({
    id: citationId,
    title: `Desk-median of ${n} GOLD ${meta.layer} books, ${meta.fieldId}, ${meta.series.toUpperCase()} ${meta.fiscalYear}`,
    publisher: "Data Libertarian desk-median",
    fiscalYear: meta.fiscalYear,
    url: "https://datalibertarian.in/compare",
    table: `Median of ${n} typed GOLD LineItems`,
    accessedOn: EXTRACT_DATE,
    short: `Middle of ${n}`,
    notes: peers
      .map((p) => `${p.slug} · ${p.money.citationId} · ₹${p.money.rupees.toLocaleString("en-IN")}`)
      .join("; "),
  });
  const money: Money = {
    crore: rupees / 10_000_000,
    rupees,
    series: meta.series,
    fiscalYear: meta.fiscalYear,
    citationId,
  };
  return {
    fieldId: meta.fieldId,
    layer: meta.layer,
    series: meta.series,
    fiscalYear: meta.fiscalYear,
    n,
    peers,
    money,
    meanCrore,
    method,
    midSlugs,
    excludePicked: meta.excludePicked,
    thin: n < 3,
  };
}

export function grainLabel(grain: CompareGrain, layer: LayerId): string {
  if (grain === "city") return "city police books";
  if (grain === "station") return "named stations";
  if (layer === "state") return "state books";
  if (layer === "union") return "Centre books";
  if (layer === "municipal") return "city books";
  return "village books";
}
