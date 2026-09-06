export type Citation = {
  id: string;
  title: string;
  publisher: string;
  fiscalYear: string;
  url: string;
  pages?: string;
  table?: string;
  accessedOn: string;
  notes?: string;
  short?: string;
};

export const EXTRACT_DATE = "2026-09-06";

export const citations: Record<string, Citation> = {
  "mh-home-whitebook-2026-27": {
    id: "mh-home-whitebook-2026-27",
    title:
      "Civil Budget Estimates 2026-2027, Part II — Detailed Budget Estimates of Expenditure, B — Home Department",
    publisher: "Finance Department, Government of Maharashtra",
    fiscalYear: "2026-27",
    url: "https://beams.mahakosh.gov.in/Beams5/BudgetMVC/MISRPT/dept.html",
    pages: "2–3, 6, 11–12 (Demand B-1)",
    table: "Summary by Major Heads; Demand B-1; 2055 Police I-Summary",
    accessedOn: EXTRACT_DATE,
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Direct PDF: BudgetBooksPDF1/2026-2027/Departmentwise Publication/B-Home Dept.pdf",
  },
  "mh-pink-book-2026-27": {
    id: "mh-pink-book-2026-27",
    title: "Budget in Brief 2026-2027 (Pink Book)",
    publisher: "Finance Department, Government of Maharashtra",
    fiscalYear: "2026-27",
    url: "https://beams.mahakosh.gov.in/Beams5/BudgetMVC/MISRPT/HomePage2021.html",
    pages: "Budget at a Glance",
    table: "Item 7. Total Expenditure (2+5)",
    accessedOn: EXTRACT_DATE,
    notes:
      "Used only for the state total against which Police share is shown. Direct PDF: BudgetBooksPDF1/2026-2027/Budget in Brief (Pink Book).pdf",
  },
  "union-sbe51-2026-27": {
    id: "union-sbe51-2026-27",
    title: "Notes on Demands for Grants, 2026-2027 — Demand No. 51, Police",
    publisher: "Ministry of Finance, Government of India",
    fiscalYear: "2026-27",
    url: "https://www.indiabudget.gov.in/doc/eb/sbe51.pdf",
    pages: "176–180",
    table: "Demand No. 51 Police — Grand Total (net) and printed groups",
    accessedOn: EXTRACT_DATE,
    notes:
      "Figures printed in crore of rupees. Union Demand 51 is Central Armed Police Forces, Delhi Police, Intelligence Bureau and related Union police heads — not all Indian police, and not the whole Ministry of Home Affairs.",
  },
  "union-sumsbe-2026-27": {
    id: "union-sumsbe-2026-27",
    title: "Notes on Demands for Grants, 2026-2027 — Summary of Contents",
    publisher: "Ministry of Finance, Government of India",
    fiscalYear: "2026-27",
    url: "https://www.indiabudget.gov.in/doc/eb/sumsbe.pdf",
    pages: "Ministry of Home Affairs block",
    table: "Ministry of Home Affairs total (Demands 49–59)",
    accessedOn: EXTRACT_DATE,
    notes:
      "Used only to show that the Ministry of Home Affairs as a whole is larger than Demand 51 Police. Not a police headline.",
  },
  "mh-appropriation-2025-26": {
    id: "mh-appropriation-2025-26",
    title:
      "Maharashtra Appropriation Act, 2025 (L.A. Bill XXVIII of 2025, as passed 21 March 2025)",
    publisher: "Legislature of Maharashtra",
    fiscalYear: "2025-26",
    url: "https://mls.org.in/assembly-bill/2025/",
    pages: "Schedule, Home Department, Grant B-1",
    table: "Grant B-1 Police Administration",
    accessedOn: EXTRACT_DATE,
    notes:
      "Voted rupees for Grant B-1. The same 2025-26 BE total is reprinted in the 2026-27 Home Department White Book (Demand B-1 I-Summary).",
  },
  "union-sbe51-2025-26": {
    id: "union-sbe51-2025-26",
    title: "Notes on Demands for Grants, 2025-2026 — Demand No. 51, Police",
    publisher: "Ministry of Finance, Government of India",
    fiscalYear: "2025-26",
    url: "https://www.indiabudget.gov.in/budget2025-26/doc/eb/sbe51.pdf",
    pages: "Demand No. 51",
    table: "Delhi Police establishment + infrastructure (prior-year BE 2024-25)",
    accessedOn: EXTRACT_DATE,
    short: "Demand 51 PDF 2025-26",
    notes: "Used only for Delhi Police 2024-25 Budget column in the est+infra series.",
  },
  "up-grant26-2026-27": {
    id: "up-grant26-2026-27",
    title: "Uttar Pradesh Budget 2026-27 — Grant 26 Home (Police)",
    publisher: "Finance Department, Government of Uttar Pradesh",
    fiscalYear: "2026-27",
    url: "https://budget.up.nic.in/PDF26_27/Gr26.pdf",
    table: "2055 voted printed; 4055 योग; object 01 वेतन desk-sum; object 51 वर्दी",
    accessedOn: EXTRACT_DATE,
    short: "UP Grant 26",
    notes: "Object 22 is hospitality, not arms. 2055-01 is a desk-sum of object lines, not the printed 2055 total.",
  },
  "tg-law-home-2026-27": {
    id: "tg-law-home-2026-27",
    title: "Telangana Budget Estimates 2026-27 — Law Department & Home Department",
    publisher: "Finance Department, Government of Telangana",
    fiscalYear: "2026-27",
    url: "https://www.telangana.gov.in/wp-content/uploads/2026/05/Law-and-Home.pdf",
    table: "Police object 010 (desk-sum); object 220; City Police 4055",
    accessedOn: EXTRACT_DATE,
    short: "TG Law+Home",
    notes:
      "Police object 010 is not Demand X Home. Home Department totals 10,188.01 (2025-26) and 11,906.83 (2026-27) are not Police. Hyderabad CP is not added into the statewide object.",
  },
  "wb-demand68-2026-27": {
    id: "wb-demand68-2026-27",
    title: "West Bengal Budget Publication 2026 — Demand 68 (2055 / 4055 slices)",
    publisher: "Finance Department, Government of West Bengal",
    fiscalYear: "2026-27",
    url: "https://finance.wb.gov.in/writereaddata/Budget_Publication/2026_bp22.pdf",
    table: "2055 Gross/Net; 4055; object 01 desk-sum; objects 22 and 25",
    accessedOn: EXTRACT_DATE,
    short: "WB Demand 68",
    notes: "Not the whole Home & Hill Affairs demand. Kolkata/HQ 108 salaries sit inside statewide 01.",
  },
};

const PRS_INDEX: { id: string; slug: string; name: string }[] = [
  { id: "prs-uttar-pradesh", slug: "uttar-pradesh", name: "Uttar Pradesh" },
  { id: "prs-maharashtra", slug: "maharashtra", name: "Maharashtra" },
  { id: "prs-bihar", slug: "bihar", name: "Bihar" },
  { id: "prs-tamil-nadu", slug: "tamil-nadu", name: "Tamil Nadu" },
  { id: "prs-west-bengal", slug: "west-bengal", name: "West Bengal" },
  { id: "prs-madhya-pradesh", slug: "madhya-pradesh", name: "Madhya Pradesh" },
  { id: "prs-karnataka", slug: "karnataka", name: "Karnataka" },
  { id: "prs-rajasthan", slug: "rajasthan", name: "Rajasthan" },
  { id: "prs-gujarat", slug: "gujarat", name: "Gujarat" },
  { id: "prs-telangana", slug: "telangana", name: "Telangana" },
  { id: "prs-punjab", slug: "punjab", name: "Punjab" },
  { id: "prs-chhattisgarh", slug: "chhattisgarh", name: "Chhattisgarh" },
  { id: "prs-haryana", slug: "haryana", name: "Haryana" },
  { id: "prs-jharkhand", slug: "jharkhand", name: "Jharkhand" },
  { id: "prs-assam", slug: "assam", name: "Assam" },
  { id: "prs-odisha", slug: "odisha", name: "Odisha" },
  { id: "prs-kerala", slug: "kerala", name: "Kerala" },
  { id: "prs-manipur", slug: "manipur", name: "Manipur" },
  { id: "prs-arunachal-pradesh", slug: "arunachal-pradesh", name: "Arunachal Pradesh" },
  { id: "prs-uttarakhand", slug: "uttarakhand", name: "Uttarakhand" },
  { id: "prs-tripura", slug: "tripura", name: "Tripura" },
  { id: "prs-nagaland", slug: "nagaland", name: "Nagaland" },
  { id: "prs-himachal-pradesh", slug: "himachal-pradesh", name: "Himachal Pradesh" },
  { id: "prs-meghalaya", slug: "meghalaya", name: "Meghalaya" },
  { id: "prs-goa", slug: "goa", name: "Goa" },
  { id: "prs-mizoram", slug: "mizoram", name: "Mizoram" },
  { id: "prs-sikkim", slug: "sikkim", name: "Sikkim" },
];

for (const p of PRS_INDEX) {
  citations[p.id] = {
    id: p.id,
    title: `${p.name} Budget Analysis 2026-27 — Police functional (AFS)`,
    publisher: "PRS Legislative Research",
    fiscalYear: "2026-27",
    url: `https://prsindia.org/budgets/states/${p.slug}-budget-analysis-2026-27`,
    table: "Police functional expenditure (AFS)",
    accessedOn: EXTRACT_DATE,
    short: "PRS AFS",
    notes:
      "INDEX only — not a state White Book or Demand extract. Discovery aid. Do not treat as GOLD LIVE.",
  };
}

citations["prs-andhra-pradesh"] = {
  id: "prs-andhra-pradesh",
  title: "Andhra Pradesh Budget Analysis — Police functional (AFS)",
  publisher: "PRS Legislative Research",
  fiscalYear: "2024-25",
  url: "https://prsindia.org/budgets/states/andhra-pradesh-budget-analysis-2026-27",
  table: "Police functional — last found 2024-25 BE and Actuals",
  accessedOn: EXTRACT_DATE,
  short: "PRS AFS",
  notes:
    "BLOCKED for 2025-26 / 2026-27: later years are percent of spend. We do not convert percent to rupees. Not a White Book extract.",
};

export function getCitation(id: string): Citation {
  const c = citations[id];
  if (!c) {
    throw new Error(`Missing citation: ${id}`);
  }
  return c;
}
