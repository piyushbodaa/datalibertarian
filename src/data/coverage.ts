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
    lastDocument: "PRS AFS Police functional — 2024-25 BE/Actuals only; later years percent of spend",
    urlTried: "https://prsindia.org/budgets/states/andhra-pradesh-budget-analysis-2026-27",
    nextSearch: "apfinance.gov.in Home detailed volume — isolate 2055 + 4055, not percent of spend",
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
      "Opened Vol1.pdf and Vol2b.pdf on 2026-09-07. OCR of Hindi major-head pages is not a clean 2055 total with a tied page. Budget at a Glance 'Police Department ₹556.16 cr' is a speech slice, not 2055. Left INDEX.",
    urlTried: "https://finance.rajasthan.gov.in/docs/budget/statebudget/2026-2027/Vol2b.pdf",
    nextSearch: "Vol2b 2055 वृहद योग with printed page; Vol3a 4055. Do not use ₹556.16 cr glance slice.",
  },
  punjab: {
    lastDocument: "Not typed",
    urlTried: "https://finance.punjab.gov.in",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  haryana: {
    lastDocument: "Not typed",
    urlTried: "https://finhry.gov.in",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  "madhya-pradesh": {
    lastDocument: "Not typed",
    urlTried: "https://finance.mp.gov.in",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  bihar: {
    lastDocument: "Not typed",
    urlTried: "https://state.bihar.gov.in/finance",
    nextSearch: "AFS 2055 + 4055 only",
  },
  assam: {
    lastDocument: "Not typed",
    urlTried: "https://finance.assam.gov.in",
    nextSearch: "Demand / AFS — isolate 2055 + 4055",
  },
  chhattisgarh: {
    lastDocument: "Not typed",
    urlTried: "https://finance.cg.gov.in/budget_doc/main_budget.asp",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  jharkhand: {
    lastDocument: "Not typed",
    urlTried: "https://finance.jharkhand.gov.in",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  goa: {
    lastDocument: "Not typed",
    urlTried: "https://goabudget.gov.in",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  uttarakhand: {
    lastDocument: "Not typed",
    urlTried: "https://budget.uk.gov.in",
    nextSearch: "Demand / White Book — isolate 2055 + 4055",
  },
  "himachal-pradesh": {
    lastDocument: "Not typed. Demand 07 is mixed Police and Allied.",
    urlTried: "https://himachal.nic.in",
    nextSearch: "Demand 07 detailed — isolate 2055 only",
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
