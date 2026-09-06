import type { LineItem, Money } from "../data/maharashtra-police";
import { functionalPolice, grantB1, police2055, police2055Lines, police4055, stateTotalExpenditure } from "../data/maharashtra-police";
import { gj2055, gj2055Minors, gj4055, gjFunctional } from "../data/gujarat/police";
import { tn2055, tn4055, tnDemand22Voted, tnFunctional } from "../data/tamil-nadu/police";
import { ka109, ka2055, ka4055, kaDemand05Home, kaFunctional } from "../data/karnataka/police";
import { kl2055, kl4055, klFunctional } from "../data/kerala/police";
import { tgObject010, tgArms220, tgCity4055 } from "../data/telangana/police";
import { up2055Voted, up4055, upFunctional, upSalariesDesk, upUniforms } from "../data/uttar-pradesh/police";
import { wb2055Net, wb4055, wbFunctional, wbSalariesDesk, wbArms, wbClothing } from "../data/west-bengal/police";
import { unionTotalExpenditure } from "../data/union/budget-at-a-glance";
import { demand51Groups, demand51Net, demand51Capital, demand51Revenue } from "../data/union/demand-51";
import { delhiEstInfra } from "../data/union/delhi-police";
import { commissionerates } from "../data/telangana/commissionerates";
import { pickAmount } from "../data/maharashtra-police";

export type SearchHit = {
  id: string;
  plainLabel: string;
  officialName: string;
  head: string;
  entity: string;
  href: string;
  money?: Money;
};

type Entry = { item: LineItem; entity: string; href: string };

const ENTRIES: Entry[] = [
  { item: functionalPolice, entity: "Maharashtra Police", href: "/maharashtra/police" },
  { item: police2055, entity: "Maharashtra Police", href: "/maharashtra/police" },
  { item: police4055, entity: "Maharashtra Police", href: "/maharashtra/police" },
  { item: grantB1, entity: "Maharashtra Grant B-1", href: "/maharashtra/police" },
  ...police2055Lines.map((item) => ({ item, entity: "Maharashtra Police", href: "/maharashtra/police" })),
  {
    item: {
      id: "mh-pink-total",
      plainLabel: "State total expenditure",
      officialName: "Pink Book total expenditure",
      head: "state-total",
      amounts: stateTotalExpenditure,
    },
    entity: "Maharashtra Pink Book",
    href: "/states",
  },
  { item: upFunctional, entity: "Uttar Pradesh Police", href: "/uttar-pradesh/police" },
  { item: up2055Voted, entity: "Uttar Pradesh Police", href: "/uttar-pradesh/police" },
  { item: up4055, entity: "Uttar Pradesh Police", href: "/uttar-pradesh/police" },
  { item: upSalariesDesk, entity: "Uttar Pradesh Police", href: "/uttar-pradesh/police" },
  { item: upUniforms, entity: "Uttar Pradesh Police", href: "/uttar-pradesh/police" },
  { item: wbFunctional, entity: "West Bengal Police", href: "/west-bengal/police" },
  { item: wb2055Net, entity: "West Bengal Police", href: "/west-bengal/police" },
  { item: wb4055, entity: "West Bengal Police", href: "/west-bengal/police" },
  { item: wbSalariesDesk, entity: "West Bengal Police", href: "/west-bengal/police" },
  { item: wbArms, entity: "West Bengal Police", href: "/west-bengal/police" },
  { item: wbClothing, entity: "West Bengal Police", href: "/west-bengal/police" },
  { item: tgObject010, entity: "Telangana Police", href: "/telangana/police" },
  { item: tgArms220, entity: "Telangana Police", href: "/telangana/police" },
  { item: tgCity4055, entity: "Telangana Police", href: "/telangana/police" },
  ...commissionerates.map((c) => ({
    item: c.combined,
    entity: c.name,
    href: `/telangana/${c.slug}`,
  })),
  { item: gjFunctional, entity: "Gujarat Police", href: "/gujarat/police" },
  { item: gj2055, entity: "Gujarat Police", href: "/gujarat/police" },
  { item: gj4055, entity: "Gujarat Police", href: "/gujarat/police" },
  ...gj2055Minors.map((item) => ({ item, entity: "Gujarat Police", href: "/gujarat/police" })),
  { item: tnFunctional, entity: "Tamil Nadu Police", href: "/tamil-nadu/police" },
  { item: tn2055, entity: "Tamil Nadu Police", href: "/tamil-nadu/police" },
  { item: tn4055, entity: "Tamil Nadu Police", href: "/tamil-nadu/police" },
  { item: tnDemand22Voted, entity: "Tamil Nadu Demand 22", href: "/tamil-nadu/police" },
  { item: kaFunctional, entity: "Karnataka Police", href: "/karnataka/police" },
  { item: ka2055, entity: "Karnataka Police", href: "/karnataka/police" },
  { item: ka4055, entity: "Karnataka Police", href: "/karnataka/police" },
  { item: ka109, entity: "Karnataka Police", href: "/karnataka/police" },
  { item: kaDemand05Home, entity: "Karnataka Demand 05 Home", href: "/karnataka/police" },
  { item: klFunctional, entity: "Kerala Police", href: "/kerala/police" },
  { item: kl2055, entity: "Kerala Police", href: "/kerala/police" },
  { item: kl4055, entity: "Kerala Police", href: "/kerala/police" },
  { item: unionTotalExpenditure, entity: "Union Budget at a Glance", href: "/union" },
  { item: demand51Net, entity: "Centre Police", href: "/union/police" },
  { item: demand51Revenue, entity: "Centre Police", href: "/union/police" },
  { item: demand51Capital, entity: "Centre Police", href: "/union/police" },
  ...demand51Groups.map((item) => ({ item, entity: "Centre Police", href: "/union/police" })),
  { item: delhiEstInfra, entity: "Delhi Police (Union)", href: "/union/delhi-police" },
];

export function searchHeads(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const e of ENTRIES) {
    const blob = `${e.item.plainLabel} ${e.item.officialName} ${e.item.head} ${e.entity} ${e.item.id}`.toLowerCase();
    if (!blob.includes(q)) continue;
    const money =
      pickAmount(e.item, "2026-27", "be") ??
      pickAmount(e.item, "2025-26", "be") ??
      e.item.amounts[0];
    hits.push({
      id: e.item.id,
      plainLabel: e.item.plainLabel,
      officialName: e.item.officialName,
      head: e.item.head,
      entity: e.entity,
      href: e.href,
      money,
    });
  }
  return hits.slice(0, 40);
}
