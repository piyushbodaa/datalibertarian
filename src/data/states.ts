export type JurisdictionKind = "state" | "ut";
export type PoliceTier = "gold" | "index" | "empty" | "blocked";

export type Jurisdiction = {
  slug: string;
  name: string;
  kind: JurisdictionKind;
  tier: PoliceTier;
  unionBooks?: boolean;
  blockReason?: string;
  /** Object-head Demand PDFs not on disk — INDEX headline only. */
  depthGap?: boolean;
  indexNote?: string;
};

export const jurisdictions: Jurisdiction[] = [
  { slug: "andhra-pradesh", name: "Andhra Pradesh", kind: "state", tier: "gold" },
  { slug: "arunachal-pradesh", name: "Arunachal Pradesh", kind: "state", tier: "gold" },
  { slug: "assam", name: "Assam", kind: "state", tier: "gold" },
  { slug: "bihar", name: "Bihar", kind: "state", tier: "gold" },
  { slug: "chhattisgarh", name: "Chhattisgarh", kind: "state", tier: "gold" },
  { slug: "goa", name: "Goa", kind: "state", tier: "gold" },
  { slug: "gujarat", name: "Gujarat", kind: "state", tier: "gold" },
  { slug: "haryana", name: "Haryana", kind: "state", tier: "gold" },
  { slug: "himachal-pradesh", name: "Himachal Pradesh", kind: "state", tier: "gold" },
  { slug: "jharkhand", name: "Jharkhand", kind: "state", tier: "gold" },
  { slug: "karnataka", name: "Karnataka", kind: "state", tier: "gold" },
  { slug: "kerala", name: "Kerala", kind: "state", tier: "gold" },
  {
    slug: "madhya-pradesh",
    name: "Madhya Pradesh",
    kind: "state",
    tier: "index",
    indexNote:
      "The 2026-27 Finance Secretary memorandum and FRBM opened. Volume-1 Annual Financial Statement and the Home demand book are still the 2025-26 files on the site, so 2055 is not isolated yet.",
  },
  { slug: "maharashtra", name: "Maharashtra", kind: "state", tier: "gold" },
  { slug: "manipur", name: "Manipur", kind: "state", tier: "gold" },
  { slug: "meghalaya", name: "Meghalaya", kind: "state", tier: "gold" },
  { slug: "mizoram", name: "Mizoram", kind: "state", tier: "gold" },
  { slug: "nagaland", name: "Nagaland", kind: "state", tier: "gold" },
  { slug: "odisha", name: "Odisha", kind: "state", tier: "gold" },
  { slug: "punjab", name: "Punjab", kind: "state", tier: "gold" },
  { slug: "rajasthan", name: "Rajasthan", kind: "state", tier: "gold" },
  { slug: "sikkim", name: "Sikkim", kind: "state", tier: "gold" },
  { slug: "tamil-nadu", name: "Tamil Nadu", kind: "state", tier: "gold" },
  { slug: "telangana", name: "Telangana", kind: "state", tier: "gold" },
  { slug: "tripura", name: "Tripura", kind: "state", tier: "gold" },
  { slug: "uttar-pradesh", name: "Uttar Pradesh", kind: "state", tier: "gold" },
  { slug: "uttarakhand", name: "Uttarakhand", kind: "state", tier: "gold" },
  { slug: "west-bengal", name: "West Bengal", kind: "state", tier: "gold" },
  {
    slug: "andaman-and-nicobar-islands",
    name: "Andaman and Nicobar Islands",
    kind: "ut",
    tier: "empty",
    unionBooks: true,
  },
  { slug: "chandigarh", name: "Chandigarh", kind: "ut", tier: "empty", unionBooks: true },
  {
    slug: "dadra-and-nagar-haveli-and-daman-and-diu",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    kind: "ut",
    tier: "empty",
    unionBooks: true,
  },
  { slug: "delhi", name: "Delhi", kind: "ut", tier: "empty", unionBooks: true },
  { slug: "jammu-and-kashmir", name: "Jammu and Kashmir", kind: "ut", tier: "empty", unionBooks: true },
  { slug: "ladakh", name: "Ladakh", kind: "ut", tier: "empty", unionBooks: true },
  { slug: "lakshadweep", name: "Lakshadweep", kind: "ut", tier: "empty", unionBooks: true },
  { slug: "puducherry", name: "Puducherry", kind: "ut", tier: "empty" },
];

export function getJurisdiction(slug: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.slug === slug);
}

export function tierLabel(tier: PoliceTier): string {
  switch (tier) {
    case "gold":
      return "From the official book";
    case "index":
      return "Not read from the book yet";
    case "blocked":
      return "Can't read a clean number";
    default:
      return "Not read yet";
  }
}
