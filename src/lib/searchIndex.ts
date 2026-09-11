import type { LineItem, Money } from "../data/maharashtra-police";
import { functionalPolice, grantB1, police2055, police2055Lines, police4055, stateTotalExpenditure } from "../data/maharashtra-police";
import { gj2055, gj2055Minors, gj4055, gjFunctional } from "../data/gujarat/police";
import { tn2055, tn4055, tnDemand22Voted, tnFunctional } from "../data/tamil-nadu/police";
import { ka109, ka2055, ka4055, kaDemand05Home, kaFunctional } from "../data/karnataka/police";
import { kl2055, kl4055, klFunctional } from "../data/kerala/police";
import { od2055, odDemand01, odFunctional } from "../data/odisha/police";
import { ap2055, ap4055, apDemandX, apFunctional } from "../data/andhra-pradesh/police";
import { pb2055, pb4055, pbFunctional } from "../data/punjab/police";
import { hr2055, hr4055, hrFunctional } from "../data/haryana/police";
import { sk2055, sk4055, skFunctional } from "../data/sikkim/police";
import { rj2055, rj4055, rjDemand18, rjFunctional } from "../data/rajasthan/police";
import { hp2055, hp4055, hpDemand07, hpFunctional } from "../data/himachal-pradesh/police";
import { br2055, br4055, brDemand22, brFunctional } from "../data/bihar/police";
import { uk2055, uk4055, ukFunctional, ukGrant10 } from "../data/uttarakhand/police";
import { as2055, as4055, asFunctional } from "../data/assam/police";
import { cg2055, cg4055, cgDemand02, cgFunctional } from "../data/chhattisgarh/police";
import { jh2055, jh4055, jhDemand22, jhFunctional } from "../data/jharkhand/police";
import { ga2055, ga4055, gaDemand17, gaFunctional } from "../data/goa/police";
import { ar2055, ar4055, arFunctional } from "../data/arunachal-pradesh/police";
import { ml2055, ml4055, mlFunctional } from "../data/meghalaya/police";
import { mn2055, mn4055, mnDemand07, mnFunctional } from "../data/manipur/police";
import { mz2055, mz4055, mzFunctional } from "../data/mizoram/police";
import { nl2055, nl4055, nlFunctional } from "../data/nagaland/police";
import { tr2055, tr4055, trFunctional } from "../data/tripura/police";
import { tgObject010, tgArms220, tgCity4055 } from "../data/telangana/police";
import { up2055Voted, up4055, upFunctional, upSalariesDesk, upUniforms } from "../data/uttar-pradesh/police";
import { wb2055Net, wb4055, wbFunctional, wbSalariesDesk, wbArms, wbClothing } from "../data/west-bengal/police";
import { unionOutstandingLiabilities, unionTotalExpenditure } from "../data/union/budget-at-a-glance";
import { demand51Groups, demand51Net, demand51Capital, demand51Revenue } from "../data/union/demand-51";
import { delhiEstInfra } from "../data/union/delhi-police";
import { commissionerates } from "../data/telangana/commissionerates";
import { pickAmount } from "../data/maharashtra-police";
import { INFLATION_ITEMS } from "../data/inflation/items";
import { latest } from "../data/inflation/yoy";

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
  { item: odFunctional, entity: "Odisha Police", href: "/odisha/police" },
  { item: od2055, entity: "Odisha Police", href: "/odisha/police" },
  { item: odDemand01, entity: "Odisha Demand 01 Home", href: "/odisha/police" },
  { item: apFunctional, entity: "Andhra Pradesh Police", href: "/andhra-pradesh/police" },
  { item: ap2055, entity: "Andhra Pradesh Police", href: "/andhra-pradesh/police" },
  { item: ap4055, entity: "Andhra Pradesh Police", href: "/andhra-pradesh/police" },
  { item: apDemandX, entity: "Andhra Pradesh Demand X Home", href: "/andhra-pradesh/police" },
  { item: ukFunctional, entity: "Uttarakhand Police", href: "/uttarakhand/police" },
  { item: uk2055, entity: "Uttarakhand Police", href: "/uttarakhand/police" },
  { item: uk4055, entity: "Uttarakhand Police", href: "/uttarakhand/police" },
  { item: ukGrant10, entity: "Uttarakhand Grant 10 Police and Jail", href: "/uttarakhand/police" },
  { item: asFunctional, entity: "Assam Police", href: "/assam/police" },
  { item: as2055, entity: "Assam Police", href: "/assam/police" },
  { item: as4055, entity: "Assam Police", href: "/assam/police" },
  { item: cgFunctional, entity: "Chhattisgarh Police", href: "/chhattisgarh/police" },
  { item: cg2055, entity: "Chhattisgarh Police", href: "/chhattisgarh/police" },
  { item: cg4055, entity: "Chhattisgarh Police", href: "/chhattisgarh/police" },
  { item: cgDemand02, entity: "Chhattisgarh Home Book 02", href: "/chhattisgarh/police" },
  { item: jhFunctional, entity: "Jharkhand Police", href: "/jharkhand/police" },
  { item: jh2055, entity: "Jharkhand Police", href: "/jharkhand/police" },
  { item: jh4055, entity: "Jharkhand Police", href: "/jharkhand/police" },
  { item: jhDemand22, entity: "Jharkhand Demand 22 Home", href: "/jharkhand/police" },
  { item: gaFunctional, entity: "Goa Police", href: "/goa/police" },
  { item: ga2055, entity: "Goa Police", href: "/goa/police" },
  { item: ga4055, entity: "Goa Police", href: "/goa/police" },
  { item: gaDemand17, entity: "Goa Demand 17 Police", href: "/goa/police" },
  { item: trFunctional, entity: "Tripura Police", href: "/tripura/police" },
  { item: tr2055, entity: "Tripura Police", href: "/tripura/police" },
  { item: tr4055, entity: "Tripura Police", href: "/tripura/police" },
  { item: mlFunctional, entity: "Meghalaya Police", href: "/meghalaya/police" },
  { item: ml2055, entity: "Meghalaya Police", href: "/meghalaya/police" },
  { item: ml4055, entity: "Meghalaya Police", href: "/meghalaya/police" },
  { item: mnFunctional, entity: "Manipur Police", href: "/manipur/police" },
  { item: mn2055, entity: "Manipur Police", href: "/manipur/police" },
  { item: mn4055, entity: "Manipur Police", href: "/manipur/police" },
  { item: mnDemand07, entity: "Manipur Demand 07 Police", href: "/manipur/police" },
  { item: nlFunctional, entity: "Nagaland Police", href: "/nagaland/police" },
  { item: nl2055, entity: "Nagaland Police", href: "/nagaland/police" },
  { item: nl4055, entity: "Nagaland Police", href: "/nagaland/police" },
  { item: mzFunctional, entity: "Mizoram Police", href: "/mizoram/police" },
  { item: mz2055, entity: "Mizoram Police", href: "/mizoram/police" },
  { item: mz4055, entity: "Mizoram Police", href: "/mizoram/police" },
  { item: arFunctional, entity: "Arunachal Pradesh Police", href: "/arunachal-pradesh/police" },
  { item: ar2055, entity: "Arunachal Pradesh Police", href: "/arunachal-pradesh/police" },
  { item: ar4055, entity: "Arunachal Pradesh Police", href: "/arunachal-pradesh/police" },
  { item: pbFunctional, entity: "Punjab Police", href: "/punjab/police" },
  { item: pb2055, entity: "Punjab Police", href: "/punjab/police" },
  { item: pb4055, entity: "Punjab Police", href: "/punjab/police" },
  { item: hrFunctional, entity: "Haryana Police", href: "/haryana/police" },
  { item: hr2055, entity: "Haryana Police", href: "/haryana/police" },
  { item: hr4055, entity: "Haryana Police", href: "/haryana/police" },
  { item: skFunctional, entity: "Sikkim Police", href: "/sikkim/police" },
  { item: sk2055, entity: "Sikkim Police", href: "/sikkim/police" },
  { item: sk4055, entity: "Sikkim Police", href: "/sikkim/police" },
  { item: rjFunctional, entity: "Rajasthan Police", href: "/rajasthan/police" },
  { item: rj2055, entity: "Rajasthan Police", href: "/rajasthan/police" },
  { item: rj4055, entity: "Rajasthan Police", href: "/rajasthan/police" },
  { item: rjDemand18, entity: "Rajasthan Demand 18 Home", href: "/rajasthan/police" },
  { item: hpFunctional, entity: "Himachal Pradesh Police", href: "/himachal-pradesh/police" },
  { item: hp2055, entity: "Himachal Pradesh Police", href: "/himachal-pradesh/police" },
  { item: hp4055, entity: "Himachal Pradesh Police", href: "/himachal-pradesh/police" },
  { item: hpDemand07, entity: "Himachal Demand 07 Police and Allied", href: "/himachal-pradesh/police" },
  { item: brFunctional, entity: "Bihar Police", href: "/bihar/police" },
  { item: br2055, entity: "Bihar Police", href: "/bihar/police" },
  { item: br4055, entity: "Bihar Police", href: "/bihar/police" },
  { item: brDemand22, entity: "Bihar Demand 22 Home", href: "/bihar/police" },
  { item: unionTotalExpenditure, entity: "Union Budget at a Glance", href: "/union" },
  { item: unionOutstandingLiabilities, entity: "Union outstanding liabilities", href: "/" },
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
  for (const item of INFLATION_ITEMS) {
    const blob = `${item.plainLabel} ${item.officialName} inflation ${item.id}`.toLowerCase();
    if (!blob.includes(q)) continue;
    if (!latest(item.observed)) continue;
    hits.push({
      id: item.id,
      plainLabel: item.plainLabel,
      officialName: item.officialName,
      head: item.category,
      entity: "Inflation",
      href: `/inflation/item/${item.id}`,
    });
  }
  return hits.slice(0, 40);
}
