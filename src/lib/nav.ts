const LABELS: Record<string, string> = {
  compare: "Compare",
  search: "Search",
  union: "Centre",
  police: "Police",
  "delhi-police": "Delhi Police",
  states: "States",
  municipal: "City",
  gram: "Village",
  sources: "Method",
  commissionerates: "Commissionerates",
  stations: "Stations",
  maharashtra: "Maharashtra",
  "uttar-pradesh": "Uttar Pradesh",
  telangana: "Telangana",
  "west-bengal": "West Bengal",
  gujarat: "Gujarat",
  "tamil-nadu": "Tamil Nadu",
  karnataka: "Karnataka",
  kerala: "Kerala",
  odisha: "Odisha",
  "andhra-pradesh": "Andhra Pradesh",
  punjab: "Punjab",
  haryana: "Haryana",
  assam: "Assam",
  chhattisgarh: "Chhattisgarh",
  jharkhand: "Jharkhand",
  goa: "Goa",
  tripura: "Tripura",
  meghalaya: "Meghalaya",
  manipur: "Manipur",
  nagaland: "Nagaland",
  mizoram: "Mizoram",
  "arunachal-pradesh": "Arunachal Pradesh",
  uttarakhand: "Uttarakhand",
  "madhya-pradesh": "Madhya Pradesh",
  bihar: "Bihar",
  rajasthan: "Rajasthan",
  "himachal-pradesh": "Himachal Pradesh",
  sikkim: "Sikkim",
  delhi: "Delhi",
  "jammu-kashmir": "Jammu and Kashmir",
  ladakh: "Ladakh",
  puducherry: "Puducherry",
  hyd: "Hyderabad",
  cyberabad: "Cyberabad",
  rachakonda: "Rachakonda",
  malkajgiri: "Malkajgiri",
  "future-city": "Future City",
  bachupally: "Bachupally",
  trace: "Trace",
};

function labelFor(seg: string): string {
  if (LABELS[seg]) return LABELS[seg];
  return seg
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export type Crumb = { to: string; label: string };

export function crumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [];
  const crumbs: Crumb[] = [{ to: "/", label: "Home" }];
  let acc = "";
  for (const part of parts) {
    acc += `/${part}`;
    crumbs.push({ to: acc, label: labelFor(part) });
  }
  return crumbs;
}

export function titleFor(pathname: string, search = ""): string {
  if (pathname === "/") return "Data Libertarian — official books, cited rupees";
  const crumbs = crumbsFor(pathname);
  const leaf = crumbs[crumbs.length - 1]?.label ?? "Ledger";
  if (pathname === "/search") {
    const q = new URLSearchParams(search).get("q");
    return q ? `Search “${q}” — Data Libertarian` : "Search — Data Libertarian";
  }
  return `${leaf} — Data Libertarian`;
}
