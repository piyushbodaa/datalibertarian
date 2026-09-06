export type JurisdictionKind = "state" | "ut";
export type PoliceStatus = "live" | "empty";

export type Jurisdiction = {
  slug: string;
  name: string;
  kind: JurisdictionKind;
  police: PoliceStatus;
  /** Police for this UT is often in Union MHA demands, not a state White Book. */
  unionBooks?: boolean;
};

export const jurisdictions: Jurisdiction[] = [
  { slug: "andhra-pradesh", name: "Andhra Pradesh", kind: "state", police: "empty" },
  { slug: "arunachal-pradesh", name: "Arunachal Pradesh", kind: "state", police: "empty" },
  { slug: "assam", name: "Assam", kind: "state", police: "empty" },
  { slug: "bihar", name: "Bihar", kind: "state", police: "empty" },
  { slug: "chhattisgarh", name: "Chhattisgarh", kind: "state", police: "empty" },
  { slug: "goa", name: "Goa", kind: "state", police: "empty" },
  { slug: "gujarat", name: "Gujarat", kind: "state", police: "empty" },
  { slug: "haryana", name: "Haryana", kind: "state", police: "empty" },
  { slug: "himachal-pradesh", name: "Himachal Pradesh", kind: "state", police: "empty" },
  { slug: "jharkhand", name: "Jharkhand", kind: "state", police: "empty" },
  { slug: "karnataka", name: "Karnataka", kind: "state", police: "empty" },
  { slug: "kerala", name: "Kerala", kind: "state", police: "empty" },
  { slug: "madhya-pradesh", name: "Madhya Pradesh", kind: "state", police: "empty" },
  { slug: "maharashtra", name: "Maharashtra", kind: "state", police: "live" },
  { slug: "manipur", name: "Manipur", kind: "state", police: "empty" },
  { slug: "meghalaya", name: "Meghalaya", kind: "state", police: "empty" },
  { slug: "mizoram", name: "Mizoram", kind: "state", police: "empty" },
  { slug: "nagaland", name: "Nagaland", kind: "state", police: "empty" },
  { slug: "odisha", name: "Odisha", kind: "state", police: "empty" },
  { slug: "punjab", name: "Punjab", kind: "state", police: "empty" },
  { slug: "rajasthan", name: "Rajasthan", kind: "state", police: "empty" },
  { slug: "sikkim", name: "Sikkim", kind: "state", police: "empty" },
  { slug: "tamil-nadu", name: "Tamil Nadu", kind: "state", police: "empty" },
  { slug: "telangana", name: "Telangana", kind: "state", police: "empty" },
  { slug: "tripura", name: "Tripura", kind: "state", police: "empty" },
  { slug: "uttar-pradesh", name: "Uttar Pradesh", kind: "state", police: "empty" },
  { slug: "uttarakhand", name: "Uttarakhand", kind: "state", police: "empty" },
  { slug: "west-bengal", name: "West Bengal", kind: "state", police: "empty" },
  {
    slug: "andaman-and-nicobar-islands",
    name: "Andaman and Nicobar Islands",
    kind: "ut",
    police: "empty",
    unionBooks: true,
  },
  { slug: "chandigarh", name: "Chandigarh", kind: "ut", police: "empty", unionBooks: true },
  {
    slug: "dadra-and-nagar-haveli-and-daman-and-diu",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    kind: "ut",
    police: "empty",
    unionBooks: true,
  },
  { slug: "delhi", name: "Delhi", kind: "ut", police: "empty", unionBooks: true },
  { slug: "jammu-and-kashmir", name: "Jammu and Kashmir", kind: "ut", police: "empty", unionBooks: true },
  { slug: "ladakh", name: "Ladakh", kind: "ut", police: "empty", unionBooks: true },
  { slug: "lakshadweep", name: "Lakshadweep", kind: "ut", police: "empty", unionBooks: true },
  { slug: "puducherry", name: "Puducherry", kind: "ut", police: "empty" },
];

export function getJurisdiction(slug: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.slug === slug);
}
