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
    lastDocument: "Not typed. Hub: finance.karnataka.gov.in budget volumes 2026-27",
    urlTried: "https://finance.karnataka.gov.in/192/budget-volumes-2026-27/en",
    nextSearch: "Expenditure Vol-1 Home — isolate 2055 + 4055 (often lakhs)",
  },
  kerala: {
    lastDocument: "Not typed. Hub: budget.kerala.gov.in",
    urlTried: "https://budget.kerala.gov.in",
    nextSearch: "Demand XII Police — isolate 2055 + 4055",
  },
  odisha: {
    lastDocument: "Not typed. Hub: finance.odisha.gov.in",
    urlTried: "https://finance.odisha.gov.in",
    nextSearch: "Demand 01 Home D-01 2026-27 — isolate 2055 + 4055",
  },
  rajasthan: {
    lastDocument: "Volume pages not tied. Salary desk-sums unsafe without page.",
    urlTried: "https://finance.rajasthan.gov.in/website/StateBudget2627.aspx",
    nextSearch: "Vol 2b / 3a — 2055 printed total with page; do not ship unsafe desk-sum",
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
