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
import { ka109, ka2055, ka4055, kaDemand05Home, kaFunctional } from "../karnataka/police";
import { kl2055, kl4055, klFunctional } from "../kerala/police";
import { od2055, odDemand01, odFunctional } from "../odisha/police";
import { ap2055, ap4055, apDemandX, apFunctional } from "../andhra-pradesh/police";
import { pb2055, pb4055, pbFunctional } from "../punjab/police";
import { hr2055, hr4055, hrFunctional } from "../haryana/police";
import { sk2055, sk4055, skFunctional } from "../sikkim/police";
import { rj2055, rj4055, rjDemand18, rjFunctional } from "../rajasthan/police";
import { hp2055, hp4055, hpDemand07, hpFunctional } from "../himachal-pradesh/police";
import { br2055, br4055, brDemand22, brFunctional } from "../bihar/police";
import { uk2055, uk4055, ukFunctional, ukGrant10 } from "../uttarakhand/police";
import { as2055, as4055, asFunctional } from "../assam/police";
import { cg2055, cg4055, cgDemand02, cgFunctional } from "../chhattisgarh/police";
import { jh2055, jh4055, jhDemand22, jhFunctional } from "../jharkhand/police";
import { ga2055, ga4055, gaDemand17, gaFunctional } from "../goa/police";
import { ar2055, ar4055, arFunctional } from "../arunachal-pradesh/police";
import { ml2055, ml4055, mlFunctional } from "../meghalaya/police";
import { mn2055, mn4055, mnDemand07, mnFunctional } from "../manipur/police";
import { mz2055, mz4055, mzFunctional } from "../mizoram/police";
import { nl2055, nl4055, nlFunctional } from "../nagaland/police";
import { tr2055, tr4055, trFunctional } from "../tripura/police";
import { tgObject010 } from "../telangana/police";
import { up2055Voted, up4055, upFunctional, upSalariesDesk } from "../uttar-pradesh/police";
import { wb2055Net, wb4055, wbFunctional, wbSalariesDesk } from "../west-bengal/police";
import { unionTotalExpenditure } from "../union/budget-at-a-glance";
import { demand51Net } from "../union/demand-51";
import { delhiEstInfra } from "../union/delhi-police";
import { getJurisdiction, jurisdictions, type PoliceTier } from "../states";
import { searchLogFor } from "../coverage";
import { commissionerates } from "../telangana/commissionerates";
import { stations } from "../telangana/stations";
import type { CompareEntity, CompareFieldId, CompareGrain, CompareSide } from "./fields";
import { COMPARE_FIELDS } from "./fields";
import type { LayerId } from "../layers";
import { medianOf, type MedianCell, type PeerHit } from "./median";

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
  { slug: "union-total", name: "Union total", layer: "union", href: "/union" },
  { slug: "union-demand-51", name: "Centre Police", layer: "union", href: "/union/police" },
  { slug: "union-delhi", name: "Delhi Police", layer: "union", href: "/union/delhi-police" },
  ...jurisdictions
    .filter((j) => j.kind === "state")
    .map((j) => ({
      slug: j.slug,
      name: j.name,
      layer: "state" as const,
      href: `/${j.slug}/police`,
    })),
  { slug: "municipal", name: "City", layer: "municipal", href: "/municipal" },
  { slug: "gram", name: "Village", layer: "gram", href: "/gram" },
  ...commissionerates.map((c) => ({
    slug: c.slug,
    name: c.name,
    layer: "state" as const,
    href: `/telangana/${c.slug}`,
    grain: "city" as const,
  })),
  ...stations.map((s) => ({
    slug: s.slug,
    name: s.name,
    layer: "state" as const,
    href: `/telangana/${s.cp}/stations/${s.slug}`,
    grain: "station" as const,
  })),
];

export function getCompareEntity(slug: string): CompareEntity | undefined {
  return COMPARE_ENTITIES.find((e) => e.slug === slug);
}

export function entitiesFor(layer: LayerId, grain: CompareGrain = "layer"): CompareEntity[] {
  if (grain === "city") return COMPARE_ENTITIES.filter((e) => e.grain === "city");
  if (grain === "station") return COMPARE_ENTITIES.filter((e) => e.grain === "station");
  return COMPARE_ENTITIES.filter((e) => e.layer === layer && !e.grain);
}

function goldState(slug: string, bag: CompareSide["bag"]): CompareSide {
  const entity = getCompareEntity(slug)!;
  return { entity, tier: "gold", bag };
}

export function resolveSide(slug: string | undefined): CompareSide | undefined {
  if (!slug) return undefined;
  const entity = getCompareEntity(slug);
  if (!entity) return undefined;

  if (entity.grain === "station") {
    return {
      entity,
      tier: "empty",
      bag: {},
      note: "No named police-station rupee is in the books we have read. We do not divide a city or state total by the number of stations.",
    };
  }
  const cp = commissionerates.find((c) => c.slug === slug);
  if (cp) {
    return { entity, tier: "gold", bag: { "police-functional": cp.combined } };
  }
  if (entity.layer === "municipal" || entity.layer === "gram") {
    return { entity, tier: "empty", bag: {}, note: "We have not read this book yet." };
  }

  if (slug === "union-total") {
    return { entity, tier: "gold", bag: { "total-exp": unionTotalExpenditure } };
  }
  if (slug === "union-demand-51") {
    return {
      entity,
      tier: "gold",
      bag: { "police-functional": demand51Net },
      note: "Centre police — not a state book.",
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
  if (slug === "karnataka") {
    return goldState(slug, {
      "police-functional": kaFunctional,
      "2055": ka2055,
      "4055": ka4055,
      "109": ka109,
      "mixed-grant": kaDemand05Home,
    });
  }
  if (slug === "kerala") {
    return goldState(slug, {
      "police-functional": klFunctional,
      "2055": kl2055,
      "4055": kl4055,
    });
  }
  if (slug === "odisha") {
    return goldState(slug, {
      "police-functional": odFunctional,
      "2055": od2055,
      "mixed-grant": odDemand01,
    });
  }
  if (slug === "andhra-pradesh") {
    return goldState(slug, {
      "police-functional": apFunctional,
      "2055": ap2055,
      "4055": ap4055,
      "mixed-grant": apDemandX,
    });
  }
  if (slug === "uttarakhand") {
    return goldState(slug, {
      "police-functional": ukFunctional,
      "2055": uk2055,
      "4055": uk4055,
      "mixed-grant": ukGrant10,
    });
  }
  if (slug === "tripura") {
    return goldState(slug, {
      "police-functional": trFunctional,
      "2055": tr2055,
      "4055": tr4055,
    });
  }
  if (slug === "meghalaya") {
    return goldState(slug, {
      "police-functional": mlFunctional,
      "2055": ml2055,
      "4055": ml4055,
    });
  }
  if (slug === "manipur") {
    return goldState(slug, {
      "police-functional": mnFunctional,
      "2055": mn2055,
      "4055": mn4055,
      "mixed-grant": mnDemand07,
    });
  }
  if (slug === "nagaland") {
    return goldState(slug, {
      "police-functional": nlFunctional,
      "2055": nl2055,
      "4055": nl4055,
    });
  }
  if (slug === "mizoram") {
    return goldState(slug, {
      "police-functional": mzFunctional,
      "2055": mz2055,
      "4055": mz4055,
    });
  }
  if (slug === "arunachal-pradesh") {
    return goldState(slug, {
      "police-functional": arFunctional,
      "2055": ar2055,
      "4055": ar4055,
    });
  }
  if (slug === "assam") {
    return goldState(slug, {
      "police-functional": asFunctional,
      "2055": as2055,
      "4055": as4055,
    });
  }
  if (slug === "chhattisgarh") {
    return goldState(slug, {
      "police-functional": cgFunctional,
      "2055": cg2055,
      "4055": cg4055,
      "mixed-grant": cgDemand02,
    });
  }
  if (slug === "jharkhand") {
    return goldState(slug, {
      "police-functional": jhFunctional,
      "2055": jh2055,
      "4055": jh4055,
      "mixed-grant": jhDemand22,
    });
  }
  if (slug === "goa") {
    return goldState(slug, {
      "police-functional": gaFunctional,
      "2055": ga2055,
      "4055": ga4055,
      "mixed-grant": gaDemand17,
    });
  }
  if (slug === "punjab") {
    return goldState(slug, {
      "police-functional": pbFunctional,
      "2055": pb2055,
      "4055": pb4055,
    });
  }
  if (slug === "haryana") {
    return goldState(slug, {
      "police-functional": hrFunctional,
      "2055": hr2055,
      "4055": hr4055,
    });
  }
  if (slug === "sikkim") {
    return goldState(slug, {
      "police-functional": skFunctional,
      "2055": sk2055,
      "4055": sk4055,
    });
  }
  if (slug === "rajasthan") {
    return goldState(slug, {
      "police-functional": rjFunctional,
      "2055": rj2055,
      "4055": rj4055,
      "mixed-grant": rjDemand18,
    });
  }
  if (slug === "himachal-pradesh") {
    return goldState(slug, {
      "police-functional": hpFunctional,
      "2055": hp2055,
      "4055": hp4055,
      "mixed-grant": hpDemand07,
    });
  }
  if (slug === "bihar") {
    return goldState(slug, {
      "police-functional": brFunctional,
      "2055": br2055,
      "4055": br4055,
      "mixed-grant": brDemand22,
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
  mid?: MedianCell | null;
  right?: Money;
};

export function goldPeerEntities(grain: CompareGrain, layer: LayerId): CompareEntity[] {
  if (grain === "city") return COMPARE_ENTITIES.filter((e) => e.grain === "city");
  if (grain === "station") return COMPARE_ENTITIES.filter((e) => e.grain === "station");
  return COMPARE_ENTITIES.filter((e) => e.layer === layer && !e.grain);
}

export function peersForField(
  grain: CompareGrain,
  layer: LayerId,
  fieldId: CompareFieldId,
  fiscalYear: string,
  series: Series,
  exclude: string[] = [],
): PeerHit[] {
  const hits: PeerHit[] = [];
  for (const e of goldPeerEntities(grain, layer)) {
    if (exclude.includes(e.slug)) continue;
    const side = resolveSide(e.slug);
    if (!side || side.tier !== "gold") continue;
    const item = side.bag[fieldId];
    if (!item) continue;
    const money = pickAmount(item, fiscalYear, series);
    if (!money) continue;
    if (money.citationId.startsWith("prs-")) continue;
    hits.push({ slug: e.slug, label: e.name, href: e.href, money });
  }
  return hits;
}

export function compareRows(
  left: CompareSide,
  right: CompareSide | undefined,
  fiscalYear: string,
  series: Series,
  opts: { grain?: CompareGrain; excludePicked?: boolean } = {},
): CompareRow[] {
  const grain = opts.grain ?? "layer";
  const layer = left.entity.layer;
  const exclude = opts.excludePicked
    ? [left.entity.slug, right?.entity.slug].filter(Boolean) as string[]
    : [];
  const rows: CompareRow[] = [];
  for (const field of COMPARE_FIELDS) {
    if (field.layer !== "any" && field.layer !== left.entity.layer && field.layer !== right?.entity.layer) {
      continue;
    }
    const lItem = left.bag[field.id as CompareFieldId];
    const rItem = right?.bag[field.id as CompareFieldId];
    const l = lItem ? pickAmount(lItem, fiscalYear, series) : undefined;
    const r = rItem ? pickAmount(rItem, fiscalYear, series) : undefined;
    const peers = peersForField(grain, layer, field.id as CompareFieldId, fiscalYear, series, exclude);
    const mid = medianOf(peers, {
      fieldId: field.id as CompareFieldId,
      layer: grain === "layer" ? layer : grain,
      series,
      fiscalYear,
      excludePicked: !!opts.excludePicked,
    });
    if (!l && !r && !mid) continue;
    rows.push({ field, left: l, mid, right: r });
  }
  return rows;
}

export function isCrossLayer(a: CompareSide, b: CompareSide): boolean {
  return a.entity.layer !== b.entity.layer;
}

export function suggestedPairs(): [string, string][] {
  return [
    ["maharashtra", "uttar-pradesh"],
    ["maharashtra", "karnataka"],
    ["maharashtra", "west-bengal"],
    ["maharashtra", "telangana"],
    ["maharashtra", "gujarat"],
    ["maharashtra", "tamil-nadu"],
    ["maharashtra", "kerala"],
    ["maharashtra", "odisha"],
    ["maharashtra", "uttarakhand"],
  ];
}

export function hatchFor(layer: LayerId): string {
  if (layer === "union") return "hatch-rust";
  if (layer === "municipal") return "hatch-ochre";
  if (layer === "gram") return "hatch-zinc";
  return "hatch-carbon";
}

export type { PoliceTier };
