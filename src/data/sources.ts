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
  "desk-median": {
    id: "desk-median",
    title: "Desk-median of GOLD books on disk",
    publisher: "Data Libertarian desk-median",
    fiscalYear: "2026-27",
    url: "https://datalibertarian.in/sources",
    table: "Median of typed GOLD LineItems sharing layer, field, series, year",
    accessedOn: EXTRACT_DATE,
    short: "Middle of the books",
    notes:
      "Not a printed government total. Median of GOLD books on this machine that printed the same line. Even N uses the mean of the two central books. Never a per-station share.",
  },
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
    short: "Maharashtra budget",
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
    short: "Maharashtra totals",
    notes:
      "Used only for the state total against which Police share is shown. Direct PDF: BudgetBooksPDF1/2026-2027/Budget in Brief (Pink Book).pdf",
  },
  "union-bag-2026-27": {
    id: "union-bag-2026-27",
    title: "Budget at a Glance 2026-2027",
    publisher: "Ministry of Finance, Government of India",
    fiscalYear: "2026-27",
    url: "https://www.indiabudget.gov.in/doc/Budget_at_Glance/bag1.pdf",
    pages: "1–2 (prose); table p. 3, item 9 Total Expenditure (10+13)",
    table: "9. Total Expenditure; 10. On Revenue Account; 13. On Capital Account",
    accessedOn: EXTRACT_DATE,
    short: "Union budget",
    notes:
      "Figures printed in crore of rupees. Union total expenditure is not Demand 51 Police, not the sum of the states, and not an India grand total of Union+State+Municipal+Gram.",
  },
  "union-rec-annex9-2026-27": {
    id: "union-rec-annex9-2026-27",
    title: "Receipt Budget 2026-2027 — Annex 9, Debt position of the Government of India",
    publisher: "Ministry of Finance, Government of India",
    fiscalYear: "2026-27",
    url: "https://www.indiabudget.gov.in/doc/rec/annex9.pdf",
    pages: "summary table: total outstanding internal and external debt and other liabilities",
    table: "As on 31 March 2026 (RE) ₹1,97,18,016 crore; as on 31 March 2027 (BE) ₹2,14,82,050 crore",
    accessedOn: EXTRACT_DATE,
    short: "Union liabilities",
    notes:
      "Figures printed in crore of rupees. This is the Union (Centre) stock of debt and other liabilities — not state debt, not municipal debt, and not a live ticker. External debt at historical rate of exchange, as printed.",
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
    short: "Centre police budget",
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
    short: "Centre police",
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
    short: "Uttar Pradesh budget",
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
    short: "Telangana budget",
    notes:
      "Police object 010 is not Demand X Home. Home Department totals 10,188.01 (2025-26) and 11,906.83 (2026-27) are not Police. Hyderabad CP is not added into the statewide object. Commissionerate HoDs are separate GOLD doors — not station allotments.",
  },
  "tg-law-home-2026-27-hyd": {
    id: "tg-law-home-2026-27-hyd",
    title: "Telangana Budget Estimates 2026-27 — Law & Home — Commissioner of City Police, Hyderabad",
    publisher: "Finance Department, Government of Telangana",
    fiscalYear: "2026-27",
    url: "https://www.telangana.gov.in/wp-content/uploads/2026/05/Law-and-Home.pdf",
    pages: "82–85 (establishment); 136–141 (schemes)",
    table: "Commissioner of City Police, Hyderabad — combined establishment + schemes (MH 108)",
    accessedOn: EXTRACT_DATE,
    short: "Hyderabad city police",
    notes:
      "HoD total. Not statewide Police object 010. Not a police-station allotment. Prior-year BE 2025-26 is the reprinted column in this volume.",
  },
  "tg-law-home-2026-27-cyberabad": {
    id: "tg-law-home-2026-27-cyberabad",
    title: "Telangana Budget Estimates 2026-27 — Law & Home — Commissioner of Cyberabad Police",
    publisher: "Finance Department, Government of Telangana",
    fiscalYear: "2026-27",
    url: "https://www.telangana.gov.in/wp-content/uploads/2026/05/Law-and-Home.pdf",
    pages: "94–96 (establishment); schemes in the same volume",
    table: "Commissioner of Cyberabad Police — combined establishment + schemes (MH 109)",
    accessedOn: EXTRACT_DATE,
    short: "Cyberabad police",
    notes:
      "HoD total. Not Bachupally PS. Not statewide object 010. Individual police-station allotments are not printed.",
  },
  "tg-law-home-2026-27-hod": {
    id: "tg-law-home-2026-27-hod",
    title: "Telangana Budget Estimates 2026-27 — Law & Home — commissionerate HoDs",
    publisher: "Finance Department, Government of Telangana",
    fiscalYear: "2026-27",
    url: "https://www.telangana.gov.in/wp-content/uploads/2026/05/Law-and-Home.pdf",
    table: "Rachakonda / Malkajgiri / Future City HoD combined totals as printed in Law+Home",
    accessedOn: EXTRACT_DATE,
    short: "Telangana city police",
    notes:
      "Amounts copied from phase1. Page numbers for these HoDs were not in the paste — not invented. Missing year-columns are gaps, not zeros.",
  },
  "gj-home-2026-27": {
    id: "gj-home-2026-27",
    title: "Budget Estimates of Home Department for 2026-2027 — Demand 043 Police",
    publisher: "Finance Department, Government of Gujarat",
    fiscalYear: "2026-27",
    url: "https://financedepartment.gujarat.gov.in/Documents/Bud-Eng_1542_2026-2-18_594.pdf",
    pages: "printed 1–3 (demand-cum-major heads / summary by major heads); printed 21 (2055 I-Summary minors)",
    table: "2055 Police Demand 043; 4055 Capital outlay on Police (under Demand 046, isolated)",
    accessedOn: EXTRACT_DATE,
    short: "Gujarat budget",
    notes:
      "Figures printed in crore of rupees. Demand 043 is 2055 only. 4055 is printed under Demand 046 among other Home capital — only the 4055 line is taken as Police capital, not Demand 046 total. Jails 2056 and courts 2014 are not Police.",
  },
  "ka-expvol1-2026-27": {
    id: "ka-expvol1-2026-27",
    title:
      "Detailed Budget Estimates of Expenditure for the year 2026-27 — Volume 1, Demand 05 Home",
    publisher: "Finance Department, Government of Karnataka",
    fiscalYear: "2026-27",
    url: "https://finance.karnataka.gov.in/uploads/EXPVOL1_1772787253.pdf",
    pages:
      "Demand 05 Home abstract (printed p. 3); 2055 HOA total printed p. 82; 2055-00-109-1-01 printed p. 78; 4055 HOA total printed p. 96",
    table: "2055 Police; 4055 Capital Outlay on Police — not Demand 05 Home total",
    accessedOn: "2026-09-07",
    short: "Karnataka budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. Confirmed against Annual Financial Statement 2026-27 Statement 1 (2055 printed p. 8; 4055 printed p. 13), https://finance.karnataka.gov.in/uploads/AFS2026-27_1772786694.pdf. Demand 05 Home also prints 2014, 2056 jails, 2070, 2235, 4059 and 4070 — those are not Police. Hero is 2055 + 4055 only.",
  },
  "kl-afs-2026-27": {
    id: "kl-afs-2026-27",
    title: "Annual Financial Statement 2026-2027 — Statements B and C (2055 / 4055, Demand XII)",
    publisher: "Finance Department, Government of Kerala",
    fiscalYear: "2026-27",
    url: "https://www.budget.kerala.gov.in/keralabudgetdoc/2026_27/AFS.pdf",
    pages: "Statement B printed p. 24–25 (2055 Police); Statement C printed p. 38–39 (4055 Capital Outlay on Police)",
    table: "2055 Police total (voted + charged); 4055 Capital Outlay on Police — not jails 2056, not vigilance 2062",
    accessedOn: "2026-09-07",
    short: "Kerala budget",
    notes:
      "Accounts 2024-25 printed in rupees. Budget / Revised / next Budget printed in thousands of rupees (crore = thousands ÷ 10,000). Hero is 2055 + 4055 only. Demand XII also prints 2062 Vigilance — that is not Police. Demand XII detailed volume URL was not found this pass.",
  },
  "ap-afs-2026-27": {
    id: "ap-afs-2026-27",
    title:
      "Annual Financial Statement & Explanatory Memorandum on Budget 2026-27 — Statements D and E (2055 / 4055)",
    publisher: "Finance Department, Government of Andhra Pradesh",
    fiscalYear: "2026-27",
    url: "https://apfinance.gov.in/...Bud@et26-27/documents/Volume-I-1.pdf",
    pages: "Statement D printed p. 15 (2055 Police); Statement E printed p. 22 (4055 Capital Outlay on Police)",
    table: "2055 Police; 4055 Capital Outlay on Police — statewide, not one Head of Department",
    accessedOn: "2026-09-07",
    short: "Andhra Pradesh budget",
    notes:
      "Figures printed in lakhs of rupees (e.g. 8272,23.46). Converted to crore by stripping commas and dividing by 100. Hero is 2055 + 4055. Jails 2056 is not Police. DG&IG Police Total 2055 in Volume-III-3 is one HoD, not the statewide line. Official budget.html href uses the path ...Bud@et26-27.",
  },
  "ap-vol3-3-2026-27": {
    id: "ap-vol3-3-2026-27",
    title: "Detailed Estimates of Expenditure 2026-27 — Volume-III/3, Law Department & Home Department",
    publisher: "Finance Department, Government of Andhra Pradesh",
    fiscalYear: "2026-27",
    url: "https://apfinance.gov.in/...Bud@et26-27/documents/Volume-III-3.pdf",
    pages: "Demand X Home summary printed p. 54 (net voted total)",
    table: "Demand X Home Administration — mixed (jails, fire, printing, home guards, prosecutions)",
    accessedOn: "2026-09-07",
    short: "Andhra Pradesh Home demand",
    notes:
      "Rupees in lakhs. Demand X net voted BE 2026-27 9164,94.68 is not Police. Used only as the quieter Home-grant figure.",
  },
  "od-d01-2026-27": {
    id: "od-d01-2026-27",
    title: "Demand for Grants 2026-2027 — Demand No. 01 Home Department",
    publisher: "Finance Department, Government of Odisha",
    fiscalYear: "2026-27",
    url: "https://finance.odisha.gov.in/sites/default/files/2025-08/D-01.pdf",
    pages: "printed p. 1 (schedule 2055 voted+charged); printed p. 3 abstract 2055 four columns",
    table: "2055 Police total — not Demand 01 Home; 4055 is not a major head in this Demand",
    accessedOn: "2026-09-07",
    short: "Odisha budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero is 2055 only. Capital in this Demand is 4059 Public Works and 4216 Housing — mixed, not taken as Police buildings. Jails 2056 and courts 2014 are not Police.",
  },
  "tn-demand22-2026-27": {
    id: "tn-demand22-2026-27",
    title: "Detailed Demand for Grant — Demand No. 22 Police (Home, Prohibition and Excise), Interim Budget 2026-2027",
    publisher: "Finance Department, Government of Tamil Nadu",
    fiscalYear: "2026-27",
    url: "https://financedept.tn.gov.in/ta/my-documents/2020/07/DemandBook_22-2.pdf",
    pages: "cover; Demand 22 summary (rupees in thousands)",
    table: "2055 Police; 4055 Capital Outlay on Police — not the mixed Demand 22 voted total",
    accessedOn: EXTRACT_DATE,
    short: "Tamil Nadu budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Demand 22 also prints 2014, 2015, 2051, 2052, 2059, 2070, 2235 and other heads — those are not Police. Hero is 2055 + 4055 only.",
  },
  "wb-demand68-2026-27": {
    id: "wb-demand68-2026-27",
    title: "West Bengal Budget Publication 2026 — Demand 68 (2055 / 4055 slices)",
    publisher: "Finance Department, Government of West Bengal",
    fiscalYear: "2026-27",
    url: "https://finance.wb.gov.in/writereaddata/Budget_Publication/2026_bp22.pdf",
    table: "2055 Gross/Net; 4055; object 01 desk-sum; objects 22 and 25",
    accessedOn: EXTRACT_DATE,
    short: "West Bengal budget",
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
    short: "Research summary",
    notes:
      "Research summary only — not the official state book. Not used as the main number.",
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
  short: "Research summary",
  notes:
    "Can't read a clean number for 2025-26 / 2026-27: later years are percent of spend. We do not convert percent to rupees.",
};

const generatedCitations: Record<string, Citation> = {};

export function registerCitation(c: Citation): void {
  generatedCitations[c.id] = c;
}

export function getCitation(id: string): Citation {
  const c = citations[id] ?? generatedCitations[id];
  if (c) return c;
  if (id.startsWith("desk-median")) return citations["desk-median"];
  throw new Error(`Missing citation: ${id}`);
}
