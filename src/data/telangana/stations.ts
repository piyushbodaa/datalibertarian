import type { CpSlug } from "./commissionerates";

export type Station = {
  slug: string;
  name: string;
  cp: CpSlug;
  tier: "empty";
  nameSource: "product-drill" | "official-list";
};

/** Named EMPTY drill endpoints only. No amounts. Demand books do not list PS allotments. */
export const stations: Station[] = [
  {
    slug: "bachupally",
    name: "Bachupally Police Station",
    cp: "cyberabad",
    tier: "empty",
    nameSource: "product-drill",
  },
];

export function getStation(cp: string, slug: string): Station | undefined {
  return stations.find((s) => s.cp === cp && s.slug === slug);
}

export function stationsFor(cp: string): Station[] {
  return stations.filter((s) => s.cp === cp);
}
