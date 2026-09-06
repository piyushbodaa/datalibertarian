import type { LineItem, Money, Series } from "../maharashtra-police";
import {
  functionalPolice,
  grantB1,
  pickAmount,
  police2055,
  police2055Lines,
  police4055,
  stateTotalExpenditure,
} from "../maharashtra-police";
import { gj2055, gj2055Minors, gj4055, gjFunctional } from "../gujarat/police";
import { tn2055, tn4055, tnDemand22Voted, tnFunctional } from "../tamil-nadu/police";
import { tgObject010 } from "../telangana/police";
import { up2055Voted, up4055, upFunctional, upSalariesDesk } from "../uttar-pradesh/police";
import { wb2055Net, wb4055, wbFunctional, wbSalariesDesk } from "../west-bengal/police";
import { unionTotalExpenditure } from "../union/budget-at-a-glance";
import { demand51Net } from "../union/demand-51";
import { delhiEstInfra } from "../union/delhi-police";
import { getJurisdiction, jurisdictions, type PoliceTier } from "../states";
import { searchLogFor } from "../coverage";
import type { CompareEntity, CompareFieldId, CompareSide } from "./fields";
import { COMPARE_FIELDS } from "./fields";
import type { LayerId } from "../layers";

function wrap(id: string, plainLabel: string, officialName: string, head: string, amounts: Money[]): LineItem {
  return { id, plainLabel, officialName, head, amounts };
}

function minor(lines: LineItem[], id: string): LineItem | undefined {
  return lines.find((l) => l.id === id);
}

const MH_TOTAL = wrap(
  "mh-pink-total",
  "State total expenditure",
  "Budget in Brief — item 7 Total Expenditure",
  "state-total",
  stateTotalExpenditure,
);

export const COMPARE_ENTITIES: CompareEntity[] = [
  { slug: "union-total", name: "Union total expenditure", layer: "union", href: "/union" },
  { slug: "union-demand-51", name: "Union Demand 51 Police", layer: "union", href: "/union/police" },
  { slug: "union-delhi", name: "Delhi Police (Union)", layer: "union", href: "/union/delhi-police" },
  ...jurisdictions
    .filter((j) => j.kind === "state")
    .map((j) => ({
      slug: j.slug,
      name: j.name,
      layer: "state" as const,
      href: `/${j.slug}/police`,
    })),
  { slug: "municipal", name: "Municipal corporations", layer: "municipal", href: "/municipal" },
  { slug: "gram", name: "Gram panchayats", layer: "gram", href: "/gram" },
];

export function getCompareEntity(slug: string): CompareEntity | undefined {
  return COMPARE_ENTITIES.find((e) => e.slug === slug);
}

export function entitiesFor(layer: LayerId): CompareEntity[] {
  return COMPARE_ENTITIES.filter((e) => e.layer === layer);
}

function goldState(slug: string, bag: CompareSide["bag"]): CompareSide {
  const entity = getCompareEntity(slug)!;
  return { entity, tier: "gold", bag };
}

export function resolveSide(slug: string | undefined): CompareSide | undefined {
  if (!slug) return undefined;
  const entity = getCompareEntity(slug);
  if (!entity) return undefined;

  if (entity.layer === "municipal" || entity.layer === "gram") {
    return { entity, tier: "empty", bag: {}, note: "Civic / village books not typed." };
  }

  if (slug === "union-total") {
    return { entity, tier: "gold", bag: { "total-exp": unionTotalExpenditure } };
  }
  if (slug === "union-demand-51") {
    return {
      entity,
      tier: "gold",
      bag: { "police-functional": demand51Net },
      note: "Centre Police demand — not a state 2055+4055 White Book.",
    };
  }
  if (slug === "union-delhi") {
    return { entity, tier: "gold", bag: { "police-functional": delhiEstInfra } };
  }

  const j = getJurisdiction(slug);
  if (!j) return undefined;

  if (slug === "maharashtra") {
    return goldState(slug, {
      "total-exp": MH_TOTAL,
      "police-functional": functionalPolice,
      "2055": police2055,
      "4055": police4055,
      "109": minor(police2055Lines, "2055-109"),
      "108": minor(police2055Lines, "2055-108"),
      "115": minor(police2055Lines, "2055-115"),
      "mixed-grant": grantB1,
    });
  }
  if (slug === "uttar-pradesh") {
    return goldState(slug, {
      "police-functional": upFunctional,
      "2055": up2055Voted,
      "4055": up4055,
      "obj-01": upSalariesDesk,
    });
  }
  if (slug === "west-bengal") {
    return goldState(slug, {
      "police-functional": wbFunctional,
      "2055": wb2055Net,
      "4055": wb4055,
      "obj-01": wbSalariesDesk,
    });
  }
  if (slug === "telangana") {
    return goldState(slug, {
      "police-functional": tgObject010,
    });
  }
  if (slug === "gujarat") {
    return goldState(slug, {
      "police-functional": gjFunctional,
      "2055": gj2055,
      "4055": gj4055,
      "109": minor(gj2055Minors, "gj-2055-109"),
      "115": minor(gj2055Minors, "gj-2055-115"),
    });
  }
  if (slug === "tamil-nadu") {
    return goldState(slug, {
      "police-functional": tnFunctional,
      "2055": tn2055,
      "4055": tn4055,
      "mixed-grant": tnDemand22Voted,
    });
  }

  const log = searchLogFor(j);
  return {
    entity,
    tier: j.tier,
    bag: {},
    note: j.indexNote ?? j.blockReason ?? log.nextSearch,
  };
}

export function yearsOf(side: CompareSide): { fiscalYear: string; series: Series }[] {
  const seen = new Set<string>();
  const out: { fiscalYear: string; series: Series }[] = [];
  for (const item of Object.values(side.bag)) {
    if (!item) continue;
    for (const a of item.amounts) {
      const k = `${a.fiscalYear}|${a.series}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ fiscalYear: a.fiscalYear, series: a.series });
    }
  }
  return out;
}

export function intersectYears(a: CompareSide, b: CompareSide): { fiscalYear: string; series: Series }[] {
  const right = new Set(yearsOf(b).map((y) => `${y.fiscalYear}|${y.series}`));
  return yearsOf(a).filter((y) => right.has(`${y.fiscalYear}|${y.series}`));
}

export type CompareRow = {
  field: (typeof COMPARE_FIELDS)[number];
  left?: Money;
  right?: Money;
};

export function compareRows(
  left: CompareSide,
  right: CompareSide,
  fiscalYear: string,
  series: Series,
): CompareRow[] {
  const rows: CompareRow[] = [];
  for (const field of COMPARE_FIELDS) {
    if (field.layer !== "any" && field.layer !== left.entity.layer && field.layer !== right.entity.layer) {
      continue;
    }
    const lItem = left.bag[field.id as CompareFieldId];
    const rItem = right.bag[field.id as CompareFieldId];
    const l = lItem ? pickAmount(lItem, fiscalYear, series) : undefined;
    const r = rItem ? pickAmount(rItem, fiscalYear, series) : undefined;
    if (!l && !r) continue;
    rows.push({ field, left: l, right: r });
  }
  return rows;
}

export function isCrossLayer(a: CompareSide, b: CompareSide): boolean {
  return a.entity.layer !== b.entity.layer;
}

export function suggestedPairs(): [string, string][] {
  return [
    ["maharashtra", "uttar-pradesh"],
    ["maharashtra", "west-bengal"],
    ["maharashtra", "telangana"],
    ["maharashtra", "gujarat"],
    ["maharashtra", "tamil-nadu"],
  ];
}

export function hatchFor(layer: LayerId): string {
  if (layer === "union") return "hatch-rust";
  if (layer === "municipal") return "hatch-ochre";
  if (layer === "gram") return "hatch-zinc";
  return "hatch-carbon";
}

export type { PoliceTier };
