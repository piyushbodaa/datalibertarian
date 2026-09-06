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
};

export function getCitation(id: string): Citation {
  const c = citations[id];
  if (!c) {
    throw new Error(`Missing citation: ${id}`);
  }
  return c;
}
