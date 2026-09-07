import { type Jurisdiction, jurisdictions, type PoliceTier } from "./states";

export function coverageCounts(): Record<PoliceTier, number> {
  return {
    gold: jurisdictions.filter((j) => j.tier === "gold").length,
    index: jurisdictions.filter((j) => j.tier === "index").length,
    blocked: jurisdictions.filter((j) => j.tier === "blocked").length,
    empty: jurisdictions.filter((j) => j.tier === "empty").length,
  };
}

export type SearchLog = {
  lastDocument: string;
  urlTried: string;
  nextSearch: string;
};

/** Per-slug search log for INDEX / EMPTY / BLOCKED doors. */
export const searchLogs: Record<string, SearchLog> = {
  "andhra-pradesh": {
    lastDocument: "AFS 2026-27 Statement D 2055 + Statement E 4055 GOLD (Volume-III-3 Demand X is mixed)",
    urlTried: "https://apfinance.gov.in/...Bud@et26-27/documents/Volume-I-1.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  gujarat: {
    lastDocument: "Home Department Budget Estimates 2026-27, Demand 043 Police + 4055 line",
    urlTried: "https://financedepartment.gujarat.gov.in/Documents/Bud-Eng_1542_2026-2-18_594.pdf",
    nextSearch: "GOLD — object-head statewide योग if a printed total appears",
  },
  "tamil-nadu": {
    lastDocument: "Demand No. 22 Police, Interim Budget 2026-27 (rupees in thousands)",
    urlTried: "https://financedept.tn.gov.in/ta/my-documents/2020/07/DemandBook_22-2.pdf",
    nextSearch: "GOLD — isolate 2055+4055; Demand 22 remainder is not police-only",
  },
  karnataka: {
    lastDocument: "Expenditure Volume-1 2026-27 Demand 05 Home — 2055 + 4055 GOLD",
    urlTried: "https://finance.karnataka.gov.in/uploads/EXPVOL1_1772787253.pdf",
    nextSearch: "GOLD — statewide object 01 योग if a printed total appears",
  },
  kerala: {
    lastDocument: "AFS 2026-27 Statement B 2055 + Statement C 4055 — Demand XII GOLD",
    urlTried: "https://www.budget.kerala.gov.in/keralabudgetdoc/2026_27/AFS.pdf",
    nextSearch: "GOLD — Demand XII detailed volume if a statewide salaries योग is printed",
  },
  odisha: {
    lastDocument: "Demand 01 Home 2026-27 — 2055 GOLD (4055 not a major head; 4059/4216 mixed)",
    urlTried: "https://finance.odisha.gov.in/sites/default/files/2025-08/D-01.pdf",
    nextSearch: "Isolate a Police line under 4059/4216 if one is printed",
  },
  rajasthan: {
    lastDocument:
      "Re-opened Vol2b.pdf and Vol1.pdf on 2026-09-07. Vol2b has 2055 पुलिस सारांश / मुख्य-शीर्ष-2055 योग / वृहद योग, but Hindi OCR interleaves State/Central/Charged columns so a single page-tied 2055 BE 2026-27 cannot be typed. Vol1 2055 पुलिस line is similarly interleaved. Budget at a Glance 'Police Department ₹556.16 cr' is a speech slice, not 2055. Left INDEX.",
    urlTried: "https://finance.rajasthan.gov.in/docs/budget/statebudget/2026-2027/Vol2b.pdf",
    nextSearch: "Vol2b 2055 वृहद योग with printed page and clean four columns; Vol3a 4055. Do not use ₹556.16 cr glance slice.",
  },
  punjab: {
    lastDocument:
      "AFS 2026-27 2055 GOLD + Capital Demand 12 DGP 4055 GOLD (Demand 36 Jails 4055 is prisons, not taken)",
    urlTried:
      "https://finance.punjab.gov.in/uploads/3b52d7c4-e9f3-44fc-acf1-e02255025854_Annual%20Financial%20Statement%20FY%202026-27.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  haryana: {
    lastDocument: "AFS 2026-27 General Abstract 2055 + 4055 GOLD",
    urlTried:
      "https://cdnbbsr.s3waas.gov.in/s386e78499eeb33fb9cac16b7555b50767/uploads/2026/03/20260320819223074.pdf",
    nextSearch: "GOLD — Vol II Demand isolate object-head salaries योग if a printed total appears",
  },
  "madhya-pradesh": {
    lastDocument:
      "Opened https://finance.mp.gov.in on 2026-09-07. FS Memo English 2026-27 and FRBM 2026-27 open (no isolated 2055). Volume-1 AFS / Demand books on the hub are still 2025-26. Guessed 2026-27 volume URLs 404. Left INDEX.",
    urlTried: "https://finance.mp.gov.in/uploads/files/FS-memo-English_2026-27.pdf",
    nextSearch:
      "Volume-1 Annual Financial Statement 2026-27 — isolate 2055 + 4055. Do not use FS Memo aggregates.",
  },
  bihar: {
    lastDocument:
      "Opened https://state.bihar.gov.in/finance and https://budget.bihar.gov.in/ViewBudgetDetailsEn.aspx on 2026-09-07. Budget portal still lists 2025-2026 (last updated 03 March 2025). First Supplementary Book 2026-27 and Appropriation (No. 2) Act 2026 open; AFS 2055 PDF for 2026-27 not on the hub. Left INDEX.",
    urlTried: "https://budget.bihar.gov.in/ViewBudgetDetailsEn.aspx",
    nextSearch: "AFS 2026-27 — isolate 2055 only. Do not use Appropriation Act mixed grant totals.",
  },
  assam: {
    lastDocument: "AFS 2026-27 Statement B 2055 (Grant 14+19) + 4055 Grant 14 GOLD",
    urlTried: "https://fin.assam.gov.in/budget_documents/budget_document/AFS/54/AB.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  chhattisgarh: {
    lastDocument: "AFS 2026-27 Volume I 2055 + 4055 GOLD (Home Book 02 is mixed)",
    urlTried:
      "https://finance.cg.gov.in/budget_doc/2026-2027/Vol-1-Annual%20Financial%20Statment/2-revenue_expenditure.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  jharkhand: {
    lastDocument: "AFS 2026-27 Statement II 2055 + 4055 GOLD (Demand 22 Home is mixed)",
    urlTried: "https://finance.jharkhand.gov.in/pdf/Budget_2026_27/Annual_Financial_Statement.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  goa: {
    lastDocument: "AFS 2026-27 2055 revenue + 4055 capital GOLD (Demand 17 is mixed)",
    urlTried: "https://goabudget.gov.in/assets/documents/2026-27/AFS/AFS_RAD.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  uttarakhand: {
    lastDocument:
      "AFS Volume 2 Part 1 2026-27 — 2055 + 4055 GOLD (Grant 10 Police and Jail is mixed; 2056 jails and 4059 public works not taken)",
    urlTried: "https://cdnbbsr.s3waas.gov.in/s3c65d7bd70fe3e5e3a2f3de681edc193d/uploads/2026/03/202603091758017689.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears in Volume 5 Grant 10",
  },
  "himachal-pradesh": {
    lastDocument:
      "Demand 07 is mixed Police and Allied. ebudget.hp.nic.in Demand 07 detailed / AFS did not open from this machine (timeout). Appropriation Act Demand 07 revenue ₹17,48,38,69,000 is mixed — not 2055. Left INDEX.",
    urlTried: "https://ebudget.hp.nic.in/",
    nextSearch: "Demand 07 detailed — isolate 2055 only. Do not use Demand 07 mixed total.",
  },
  tripura: {
    lastDocument: "AFS 2026-27 2055 net + 4055 GOLD",
    urlTried: "https://tripura.gov.in/sites/default/files/Annual%20Financial%20Statement%202026-27.pdf",
    nextSearch: "GOLD — statewide object-head salaries योग if a printed total appears",
  },
  meghalaya: {
    lastDocument: "AFS 2026-27 Statement D 2055 voted+charged + 4055 GOLD",
    urlTried: "https://megfinance.gov.in/budget_documents/2026-2027/others/financial_statement.pdf",
    nextSearch: "GOLD — Demand 16 isolate if a statewide salaries योग is printed; not 2216 Housing (Police)",
  },
  manipur: {
    lastDocument: "AFS 2026-27 2055 + 4055 GOLD (Demand 07 is mixed)",
    urlTried: "https://manipur.gov.in/wp-content/uploads/2026/03/Annual-Financial-Statement-2026-27.pdf",
    nextSearch: "GOLD — Demand 07 object-head salaries योग if a printed total appears",
  },
  nagaland: {
    lastDocument: "AFS 2026-27 Statement I 2055 + 4055 GOLD",
    urlTried: "https://finance.nagaland.gov.in/Content/Files/0A27EEA8-38BD-4791-B45B-C7D76CE4FE11.pdf",
    nextSearch: "GOLD — Demand 28 Civil Police object-head salaries योग if a printed total appears",
  },
  mizoram: {
    lastDocument: "AFS 2026-27 2055 (Police + FSL) + 4055 GOLD",
    urlTried: "https://finance.mizoram.gov.in/uploads/attachments/2026/02/2267c19ad725d4218fd36e87ef6cb167/afs-2026-27-final.pdf",
    nextSearch: "GOLD — Demand detailed volume if a statewide salaries योग is printed",
  },
  "arunachal-pradesh": {
    lastDocument: "AFS 2026-27 Statement B 2055 + 4055 GOLD",
    urlTried: "https://arunachalbudget.in/docs/AFS-2026-27.pdf",
    nextSearch: "GOLD — Demand 8 object-head salaries योग if a printed total appears",
  },
  sikkim: {
    lastDocument:
      "Opened sikkimfred.gov.in Budget_Forms.aspx (lists 2026-27 AFS / Demand for Grants). Budget_Main_Page.aspx returned 401 Unauthorized. Direct AFS URLs 404 (AFS.pdf, Annual Financial Statement 2026-27.pdf). Vote on Account Apr–Sep 2026 is not the full AFS 2055. Left INDEX.",
    urlTried: "http://www.sikkimfred.gov.in/Budget_2026-27/Documents/AFS.pdf",
    nextSearch:
      "Sikkim AFS 2026-27 2055 Police line with printed page; Demand for Grants isolate 2055+4055. Not Vote on Account. Not PRS ₹650 crore sector slice.",
  },
  delhi: {
    lastDocument: "Union Demand 51 — Delhi Police is a Union sub-door",
    urlTried: "https://www.indiabudget.gov.in/doc/eb/sbe51.pdf",
    nextSearch: "Do not promote GNCTD AFS as Delhi Police",
  },
  "jammu-and-kashmir": {
    lastDocument: "Union Demand 51 prints a J&K Police group — not a state White Book",
    urlTried: "https://www.indiabudget.gov.in/doc/eb/sbe51.pdf",
    nextSearch: "Keep as Union group; SBE 52–56 if a UT demand isolates 2055",
  },
};

export function searchLogFor(j: Jurisdiction): SearchLog {
  if (searchLogs[j.slug]) return searchLogs[j.slug];
  if (j.kind === "ut") {
    return {
      lastDocument: "Not in PRS AFS Police functional INDEX of 27. No White Book typed.",
      urlTried: "https://www.indiabudget.gov.in/doc/eb/sbe52.pdf (through sbe56.pdf)",
      nextSearch: "Union SBE 52–56 — isolate 2055 + 4055; not Demand 51 net",
    };
  }
  return {
    lastDocument: "PRS AFS Police functional INDEX only — not a White Book extract",
    urlTried: `https://prsindia.org/budgets/states/${j.slug}-budget-analysis-2026-27`,
    nextSearch: "State finance Demand / White Book — isolate 2055 + 4055",
  };
}
