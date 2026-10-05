export type Citation = {
  id: string;
  title: string;
  publisher: string;
  fiscalYear: string;
  url: string;
  pages?: string;
  table?: string;
  accessedOn: string;
  reviewedOn?: string;
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
  "tg-afs-2026-27": {
    id: "tg-afs-2026-27",
    title: "Telangana Budget 2026-27 — Annual Financial Statement & Explanatory Memorandum",
    publisher: "Finance Department, Government of Telangana",
    fiscalYear: "2026-27",
    url: "https://www.telangana.gov.in/wp-content/uploads/2026/05/Annual_Financial_Statement__Explanatory_Memorandum_1773980967_.pdf",
    pages: "Statement D pp. 9–11 (revenue); Statement E pp. 14–15 (capital)",
    table: "Major heads 2210, 2211, 4210, 4211 (Health); 2501, 2506, 2515, 4515 (Rural Development); 2217 (Urban Development)",
    accessedOn: "2026-09-14",
    short: "Telangana AFS 2026-27",
    notes:
      "Printed in lakhs as e.g. 9690,01.35; commas stripped, crore = lakhs ÷ 100. Health running = 2210 + 2211 and equals the printed Total (b) on p. 9; buildings = 4210 + 4211 and equals the printed Total (b) on p. 14. 4211 is printed '..' for both 2025-26 columns and is not typed as zero. Rural hero = 2515 + 4515. 2501 and 2506 are shown separately; MGNREGS wages are not in these heads. Department grand totals in the Budget in Brief are larger than these heads and are not the hero.",
  },
  "tg-bib-2026-27": {
    id: "tg-bib-2026-27",
    title: "Telangana Budget 2026-27 — Budget in Brief",
    publisher: "Finance Department, Government of Telangana",
    fiscalYear: "2026-27",
    url: "https://www.telangana.gov.in/wp-content/uploads/2026/05/Budget-in-Brief.pdf",
    pages: "p. 18",
    table: "Table 11 — Secretariat Department wise Budget 2026-27 (Rs. in crore)",
    accessedOn: "2026-09-14",
    short: "Telangana Budget in Brief",
    notes:
      "Department grand totals: Health, Medical & Family Welfare 13,679; Panchayat Raj and Rural Development 33,688; Municipal Administration & Urban Development 17,907. A department total mixes many major heads and is shown only as context — never as the Health or village hero.",
  },
  "ghmc-be-2025-26": {
    id: "ghmc-be-2025-26",
    title: "GHMC Budget Estimates 2025-26 & Revised Budget Estimates 2024-25",
    publisher: "Greater Hyderabad Municipal Corporation",
    fiscalYear: "2025-26",
    url: "https://www.ghmc.gov.in/Budget/GHMC%20BUdget%202025-26%20Final%20for%20Printing.pdf",
    pages: "p. 27",
    table: "XIII Budget Highlights FY 2025-26 — A. GHMC Budget (Amount in Rs Cr)",
    accessedOn: "2026-09-14",
    short: "GHMC budget 2025-26",
    notes:
      "Printed in crore. Budget Size (RE + CE) is revenue expenditure plus capital expenditure. The 2023-24 actual is printed as 7,119.00 while its parts print as 2,896.90 + 4,223.80 = 7,120.70; the printed total is kept. Table B 'Other Budget' (housing for the poor, XV FC NCAP grants) is not added in. No 2026-27 book is on ghmc.gov.in/ghmcbuget.aspx as of 14 September 2026; the press figure of ₹11,460 crore is not typed.",
  },
  "bmc-be-2026-27": {
    id: "bmc-be-2026-27",
    title: "BMC Budget Estimates 2026-27 — Budget at a Glance (Overall Size of Budget A, B, E, G & Tree Authority)",
    publisher: "Brihanmumbai Municipal Corporation",
    fiscalYear: "2026-27",
    url: "https://data.opencity.in/dataset/aff7a167-5443-4a30-9709-c182e4b38435/resource/c80a065f-9f03-4ae9-a4c6-6d91f4107134/download/bmc-2026-27-at-a-glance.pdf",
    pages: "p. 5",
    table: "Net Total row and the Income / Expenditure box (Rs in crore)",
    accessedOn: "2026-09-14",
    short: "BMC budget 2026-27",
    notes:
      "BMC's own book, published on portal.mcgm.gov.in (Budget Estimate 2026-2027 page); that portal serves only through a browser session, so the link is the Open City mirror of the same PDF. Revenue expenditure 32,698.44 + capital expenditure 48,164.28 = printed Total 80,862.72. The printed Total Size of Budget 80,952.56 adds 89.84 of excess income and is not typed as spend. Inter-budget contributions are already netted in the book.",
  },
  "mha-ddg-2026-27-vol2a": {
    id: "mha-ddg-2026-27-vol2a",
    title: "Detailed Demands for Grants 2026-27 of the Ministry of Home Affairs — Volume II-A (Demands 52 Andaman & Nicobar Islands, 53 Chandigarh)",
    publisher: "Ministry of Home Affairs, Government of India",
    fiscalYear: "2026-27",
    url: "https://www.mha.gov.in/sites/default/files/2026-02/DDGVol2A2026-27_11022026.pdf",
    pages: "A&NI pp. 28, 198; Chandigarh pp. 21, 132",
    table: "Total - Police (Major Head) under 2055; Total - Capital Outlay on Police (Major Head) under 4055",
    accessedOn: "2026-09-14",
    short: "MHA DDG Vol II-A",
    notes:
      "₹ in thousands. Each UT is its own demand; the police lines are the Territory's police, not CAPF (Demand 51). Chandigarh 2055 includes ₹1,000 thousand charged in the estimate columns. Jails 2056 and 4059 public works are not taken.",
  },
  "mha-ddg-2026-27-vol2b": {
    id: "mha-ddg-2026-27-vol2b",
    title: "Detailed Demands for Grants 2026-27 of the Ministry of Home Affairs — Volume II-B (Demands 54 DNH & DD, 55 Ladakh, 56 Lakshadweep)",
    publisher: "Ministry of Home Affairs, Government of India",
    fiscalYear: "2026-27",
    url: "https://www.mha.gov.in/sites/default/files/2026-02/DDGVol2B2026-27_11022026.pdf",
    pages: "DNH&DD pp. 18, 94; Ladakh pp. 30, 140; Lakshadweep pp. 13, 79",
    table: "Total - Police (Major Head) under 2055; Total - Capital Outlay on Police (Major Head) under 4055",
    accessedOn: "2026-09-14",
    short: "MHA DDG Vol II-B",
    notes:
      "₹ in thousands. Demands 57–59 (Delhi, J&K, Puducherry) are transfers, not police lines, and stay blocked.",
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
      "Accounts 2024-25 printed in rupees. Budget / Revised / next Budget printed in thousands of rupees (crore = thousands ÷ 10,000). Hero is 2055 + 4055 only. Demand XII also prints 2062 Vigilance — that is not Police. Demand XII detailed volume URL was not found this pass. Health also read from this book: 2210, 2211 (Statement B pp. 26–27) and 4210 (Statement C pp. 38–39); 4211 blank.",
  },
  "pb-afs-2026-27": {
    id: "pb-afs-2026-27",
    title: "Annual Financial Statement and Explanatory Memorandum on the Budget of the Government of Punjab for the year 2026-27",
    publisher: "Finance Department, Government of Punjab",
    fiscalYear: "2026-27",
    url: "https://finance.punjab.gov.in/uploads/3b52d7c4-e9f3-44fc-acf1-e02255025854_Annual%20Financial%20Statement%20FY%202026-27.pdf",
    pages: "printed p. 14 (2055 Police, revenue disbursements)",
    table: "2055 Police — not jails 2056",
    accessedOn: "2026-09-07",
    short: "Punjab budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero running costs are this AFS 2055 line. 4055 is taken from Capital Demand 12 (DGP), not the AFS 4055 total, because Demand 36 Jails also prints 4055 for prisons. Health also read: 2210, 2211 (p. 16) and 4210 (p. 24).",
  },
  "pb-capital-2026-27": {
    id: "pb-capital-2026-27",
    title: "Demands for Grants (Capital) — with Detailed Estimates of Capital Expenditure, 2026-27, Demand 12 Home Affairs",
    publisher: "Finance Department, Government of Punjab",
    fiscalYear: "2026-27",
    url: "https://finance.punjab.gov.in/uploads/eaf0ebb7-2ecb-4045-aefc-0f71f5029e08_Capital%20Expenditure%20Budget%20Book%20FY%202026-27.pdf",
    pages: "printed p. 134 (Demand 12 4055 DGP total); printed p. 135 (4055 I-Summary); printed p. 502–506 (Demand 36 Jails 4055 — not taken)",
    table: "4055 Capital Outlay on Police — Demand 12 Director General of Police",
    accessedOn: "2026-09-07",
    short: "Punjab capital demand",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Demand 36 Jails prints 4055 for central jails, district jails and prison modernisation — that is not Police. Demand 12 4070 Home Guards / prosecutions is not Police.",
  },
  "hr-afs-2026-27": {
    id: "hr-afs-2026-27",
    title: "Annual Financial Statement and Explanatory Memorandum on the Budget 2026-27",
    publisher: "Finance Department, Government of Haryana",
    fiscalYear: "2026-27",
    url: "https://cdnbbsr.s3waas.gov.in/s386e78499eeb33fb9cac16b7555b50767/uploads/2026/03/20260320819223074.pdf",
    pages: "printed p. 13 (2055 Police); printed p. 18 (4055 Capital Outlay on Police)",
    table: "2055 Police; 4055 Capital Outlay on Police — not jails 2056, not 4059 public works",
    accessedOn: "2026-09-07",
    short: "Haryana budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero is 2055 + 4055. Vol II Demands for Grants URL was not found this pass. Hub: https://finhry.gov.in. Health also read: 2210, 2211 (p. 14) and 4210 (p. 18); 4211 printed 0.",
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
      "Figures printed in lakhs of rupees (e.g. 8272,23.46). Converted to crore by stripping commas and dividing by 100. Hero is 2055 + 4055. Jails 2056 is not Police. DG&IG Police Total 2055 in Volume-III-3 is one HoD, not the statewide line. Official budget.html href uses the path ...Bud@et26-27. Health also read: 2210, 2211 (Statement D p. 17) and 4210, 4211 (Statement E p. 22).",
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
  "tr-afs-2026-27": {
    id: "tr-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — 2055 Police net and 4055 Capital Outlay on Police",
    publisher: "Finance Department, Government of Tripura",
    fiscalYear: "2026-27",
    url: "https://tripura.gov.in/sites/default/files/Annual%20Financial%20Statement%202026-27.pdf",
    pages: "printed p. 21 (2055 Police net); printed p. 30 (4055 Capital Outlay on Police)",
    table: "2055 Police net; 4055 Capital Outlay on Police — not jails 2056",
    accessedOn: "2026-09-07",
    short: "Tripura budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. Hero is 2055 net + 4055. Gross 2055 BE 2026-27 equals net (recovery nil on estimates). Health also read, net of recoveries: 2210, 2211 (p. 23) and 4210, 4211 (pp. 30–31).",
  },
  "ml-afs-2026-27": {
    id: "ml-afs-2026-27",
    title:
      "Annual Financial Statement and Estimates of Receipts and Disbursements on Public Account 2026-27 — Statement D (2055 / 4055)",
    publisher: "Finance Department, Government of Meghalaya",
    fiscalYear: "2026-27",
    url: "https://megfinance.gov.in/budget_documents/2026-2027/others/financial_statement.pdf",
    pages: "Statement D printed p. 18 (2055 voted + charged); printed p. 27 (4055 Capital Outlay on Police)",
    table: "2055 Police voted+charged; 4055 Capital Outlay on Police — not 2056 jails, not 2216 Housing (Police)",
    accessedOn: "2026-09-07",
    short: "Meghalaya budget",
    notes:
      "Figures printed in thousands of rupees (Indian grouping). Converted to crore by dividing by 10,000. Charged 2055 actuals 2024-25 not printed — that year is voted only. 2070 Fire / Home Guards and 2216 Housing (Police) are not Police. Health also read: 2210, 2211 (p. 20) and 4210 (p. 29).",
  },
  "mn-afs-2026-27": {
    id: "mn-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — 2055 Police and 4055 Capital Outlay on Police",
    publisher: "Finance Department, Government of Manipur",
    fiscalYear: "2026-27",
    url: "https://manipur.gov.in/wp-content/uploads/2026/03/Annual-Financial-Statement-2026-27.pdf",
    pages: "printed p. 7 (2055 Police); printed p. 11 (4055 Capital Outlay on Police)",
    table: "2055 Police; 4055 Capital Outlay on Police — not jails 2056",
    accessedOn: "2026-09-07",
    short: "Manipur budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. AFS 2055 is the net line after SRE recovery as printed. Hero is 2055 + 4055. Health also read: 2210, 2211 (p. 8) and 4210, 4211 (p. 11).",
  },
  "mn-dfg-2026-27": {
    id: "mn-dfg-2026-27",
    title: "Demands for Grants 2026-27 — Demand No. 07 Police (summary)",
    publisher: "Finance Department, Government of Manipur",
    fiscalYear: "2026-27",
    url: "https://manipur.gov.in/wp-content/uploads/2026/03/DFG-2026-27-Complete.pdf",
    pages: "summary Demand 07 Police net total",
    table: "Demand 07 Police — mixed (2055, 2216 housing, 2235, 3454, 4055)",
    accessedOn: "2026-09-07",
    short: "Manipur Police demand",
    notes:
      "Rupees in lakhs. Demand 07 net voted BE 2026-27 274197.49 is not Police-only. Used only as the quieter mixed-grant figure.",
  },
  "nl-afs-2026-27": {
    id: "nl-afs-2026-27",
    title: "Annual Financial Statement (Budget) 2026-27 — Statement I (2055 / 4055)",
    publisher: "Finance Department, Government of Nagaland",
    fiscalYear: "2026-27",
    url: "https://finance.nagaland.gov.in/Content/Files/0A27EEA8-38BD-4791-B45B-C7D76CE4FE11.pdf",
    pages: "printed p. 5 (2055 Police); printed p. 8 (4055 Capital Outlay on Police)",
    table: "2055 Police; 4055 Capital Outlay on Police — not jails 2056",
    accessedOn: "2026-09-07",
    short: "Nagaland budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. Hero is 2055 + 4055. Demand 28 Civil Police is not this statewide AFS line. Health also read: 2210, 2211 (p. 6) and 4210 (p. 8).",
  },
  "mz-afs-2026-27": {
    id: "mz-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — 2055 Police and 4055 Capital Outlay on Police",
    publisher: "Finance Department, Government of Mizoram",
    fiscalYear: "2026-27",
    url: "https://finance.mizoram.gov.in/uploads/attachments/2026/02/2267c19ad725d4218fd36e87ef6cb167/afs-2026-27-final.pdf",
    pages: "printed p. 7 (2055 Police including Forensic Science Laboratory); printed p. 13 (4055 Capital Outlay on Police)",
    table: "2055 Police; 4055 Capital Outlay on Police — not jails 2056, not home guards 2070",
    accessedOn: "2026-09-07",
    short: "Mizoram budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. 2055 total includes Forensic Science Laboratory as printed under 2055. Home Guards and Fire sit on 2070 — not Police. Health also read: 2210, 2211 (p. 8) and 4210 (p. 13).",
  },
  "ar-afs-2026-27": {
    id: "ar-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — Statement B (2055 / 4055)",
    publisher: "Finance, Planning and Investment Department, Government of Arunachal Pradesh",
    fiscalYear: "2026-27",
    url: "https://arunachalbudget.in/docs/AFS-2026-27.pdf",
    pages: "Statement B printed p. 7 (2055 Police); printed p. 12 (4055 Capital Outlay on Police)",
    table: "2055 Police; 4055 Capital Outlay on Police — statewide, not Demand 8 mixed",
    accessedOn: "2026-09-07",
    short: "Arunachal Pradesh budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero is 2055 + 4055. Jails 2056 is not Police. Demand 8 also prints 2235 — that mixed total is not taken. Health also read: 2210, 2211 (p. 8) and 4210, 4211 (p. 12).",
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
  "as-afs-2026-27": {
    id: "as-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — Statement B (2055 / 4055)",
    publisher: "Finance Department, Government of Assam",
    fiscalYear: "2026-27",
    url: "https://fin.assam.gov.in/budget_documents/budget_document/AFS/54/AB.pdf",
    pages: "Statement B PDF p. 4–5 (2055 Grant 14 + Grant 19); PDF p. 26 (4055 Grant 14)",
    table: "2055 Police statewide (Grant 14 voted+charged + Grant 19); 4055 Capital Outlay on Police Grant 14",
    accessedOn: "2026-09-07",
    short: "Assam budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. 2055 is a desk-sum of the two printed Grant lines. Grant 14 charged ₹530 lakh is inside the Grant 14 2055 AFS total. Grant 19 4055 is listed without a printed figure — not typed as ₹0. Jails 2056 is not Police. Health also read as grant-row desk-sums equal to the printed Total (b): 2210, 2211 (PDF pp. 8–9) and 4210, 4211 (PDF pp. 32–33).",
  },
  "cg-afs-2026-27": {
    id: "cg-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — Volume I, revenue and capital (2055 / 4055)",
    publisher: "Finance Department, Government of Chhattisgarh",
    fiscalYear: "2026-27",
    url: "https://finance.cg.gov.in/budget_doc/2026-2027/Vol-1-Annual%20Financial%20Statment/2-revenue_expenditure.pdf",
    pages: "revenue printed p. 3 (2055 Police); capital https://finance.cg.gov.in/budget_doc/2026-2027/Vol-1-Annual%20Financial%20Statment/4-capital_expenditure.pdf printed p. 8 (4055)",
    table: "2055 Police; 4055 Capital Outlay on Police — not jails 2056",
    accessedOn: "2026-09-07",
    short: "Chhattisgarh budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero is 2055 + 4055. Confirmed against headwise breakup 2055 योग 72,40,00,61 and 4055 योग 6,60,61,40 for BE 2026-27. Health also read: 2210, 2211 (revenue file p. 4) and 4210, 4211 from the capital file 4-capital_expenditure.pdf in the same folder (p. 8).",
  },
  "cg-t02-2026-27": {
    id: "cg-t02-2026-27",
    title: "Home Department Book 02 — Grant-wise provision 2026-27 (T-02)",
    publisher: "Finance Department, Government of Chhattisgarh",
    fiscalYear: "2026-27",
    url: "https://finance.cg.gov.in/budget_doc/2026-2027/Book/02/T-02.pdf",
    pages: "printed p. 1, योग 83823011 thousands (revenue + capital)",
    table: "Home Department Book 02 total — mixed (fire, home guards, other admin)",
    accessedOn: "2026-09-07",
    short: "Chhattisgarh Home demand",
    notes:
      "Rupees in thousands. Home Book 02 योग BE 2026-27 83823011 is not Police. Used only as the quieter Home-grant figure.",
  },
  "jh-afs-2026-27": {
    id: "jh-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — Statement II (2055 / 4055)",
    publisher: "Finance Department, Government of Jharkhand",
    fiscalYear: "2026-27",
    url: "https://finance.jharkhand.gov.in/pdf/Budget_2026_27/Annual_Financial_Statement.pdf",
    pages: "printed p. 6 (2055 Police Total); printed p. 14 (4055 Capital Outlay on Police Total); printed p. 31 (Demand 22 Home mixed net)",
    table: "2055 Police Total; 4055 Capital Outlay on Police Total — not Demand 22 Home, not jails 2056",
    accessedOn: "2026-09-07",
    short: "Jharkhand budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. 2055 BE 2026-27 Total 772604.67 is establishment 761504.67 + state scheme 1800 + central 9300. 4055 BE 2026-27 Total 56500 is state scheme 48700 + central 7800. Demand 22 Home net 908106.10 is mixed. Health also read: 2210, 2211 (p. 7) and 4210 (p. 14).",
  },
  "ga-afs-2026-27": {
    id: "ga-afs-2026-27",
    title: "Annual Financial Statement 2026-27 — revenue and capital disbursement (2055 / 4055)",
    publisher: "Finance Department, Government of Goa",
    fiscalYear: "2026-27",
    url: "https://goabudget.gov.in/assets/documents/2026-27/AFS/AFS_RAD.pdf",
    pages: "AFS_RAD 2055 Police; AFS_CAD 4055 Capital Outlay on Police (https://goabudget.gov.in/assets/documents/2026-27/AFS/AFS_CAD.pdf)",
    table: "2055 Police statewide; 4055 Capital Outlay on Police — not Demand 17 mixed, not jails 2056",
    accessedOn: "2026-09-07",
    short: "Goa budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. Statewide 2055 includes forensic science (Demand 91). Demand 17 2055 is smaller because it excludes that forensic slice. Hero is AFS 2055 + 4055.",
  },
  "ga-vol1-2026-27": {
    id: "ga-vol1-2026-27",
    title: "Demands for Grants 2026-27 — Volume I, Demand No. 17 Police",
    publisher: "Finance Department, Government of Goa",
    fiscalYear: "2026-27",
    url: "https://goabudget.gov.in/assets/documents/2026-27/Vol-I/Vol-I.pdf",
    pages: "Demand No. 17 Police abstract",
    table: "Demand 17 total — mixed (2055, 2071 pensions, 3055 road transport, 4055)",
    accessedOn: "2026-09-07",
    short: "Goa Police demand",
    notes:
      "Rupees in lakhs. Demand 17 total BE 2026-27 110000.01 is not the statewide 2055 line. Used only as the quieter mixed-demand figure.",
  },
  "uk-afs-2026-27": {
    id: "uk-afs-2026-27",
    title:
      "Annual Financial Statement 2026-27 — Volume 2 Part 1 (2055 Police / 4055 Capital Outlay on Police)",
    publisher: "Budget Directorate, Finance Department, Government of Uttarakhand",
    fiscalYear: "2026-27",
    url: "https://cdnbbsr.s3waas.gov.in/s3c65d7bd70fe3e5e3a2f3de681edc193d/uploads/2026/03/202603091758017689.pdf",
    pages:
      "Revenue Account A-General Services — 2055 Police (Amount in Thousand); Capital Account — 4055 Capital Outlay on Police",
    table: "2055 Police; 4055 Capital Outlay on Police — statewide, not 2056 Jails, not 4059 Public Works",
    accessedOn: "2026-09-07",
    short: "Uttarakhand budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero is 2055 + 4055. Confirmed against Volume 5 Part 1 Grant 10 Police and Jail schedule. Jails 2056 and 4059 Public Works in that grant are not Police. Health also read from the major-head total rows: 2210, 2211 and 4210, 4211 (Volume 2 Part 1).",
  },
  "uk-vol5-g10-2026-27": {
    id: "uk-vol5-g10-2026-27",
    title: "Head-wise details of accounts 2026-27 — Volume 5 Part 1, Grant 10 Police and Jail",
    publisher: "Budget Directorate, Finance Department, Government of Uttarakhand",
    fiscalYear: "2026-27",
    url: "https://cdnbbsr.s3waas.gov.in/s3c65d7bd70fe3e5e3a2f3de681edc193d/uploads/2026/03/20260309649781473.pdf",
    pages: "Grant 10 Police and Jail schedule — revenue + capital voted total",
    table: "Grant 10 Police and Jail — mixed (2055, 2056 jails, 4055, 4059 public works)",
    accessedOn: "2026-09-07",
    short: "Uttarakhand Police and Jail grant",
    notes:
      "Rupees in thousands. Grant 10 voted total BE 2026-27 35246958 is not Police. Used only as the quieter mixed-grant figure.",
  },
  "pmd-retail-2026-09-10": {
    id: "pmd-retail-2026-09-10",
    title:
      "All India Average Retail Price of essential commodities as on 10/09/2026 — Price Monitoring Division",
    publisher: "Department of Consumer Affairs, Government of India",
    fiscalYear: "2026-27",
    url: "https://fcainfoweb.nic.in/",
    pages:
      "Daily average retail report https://fcainfoweb.nic.in/Reports/DB/Dailyprices.aspx (as on 10/09/2026; 1 month 10/08/2026; 1 year 10/09/2025). Homepage grids match the latest column.",
    table: "All India Average Retail Price — units as printed (kg / litre / dozen)",
    accessedOn: "2026-09-11",
    short: "PMD retail",
    notes:
      "Observed rupees, not CPI. Additional commodities (eggs, bajra, ghee, …) print only the day on the homepage. Broken rice 1-year column prints 0 — not taken as a price.",
  },
  "ppac-fuel-2026-09-10": {
    id: "ppac-fuel-2026-09-10",
    title: "RSP of Petrol and Diesel in Delhi as per IOCL outlet as on 10-September-2026",
    publisher: "Petroleum Planning & Analysis Cell, Ministry of Petroleum and Natural Gas",
    fiscalYear: "2026-27",
    url: "https://ppac.gov.in/download.php?file=importantnews/1789018679_PP_9_a_DailyPriceMSHSD_Metro_10.09.2026.pdf",
    pages:
      "Metro RSP table posted 10-Sep-26: Delhi petrol ₹102.12 (also 10-Aug-26); ₹94.77 on 10-Sep-25. Diesel ₹95.20 / ₹95.20 / ₹87.67. Also listed on https://ppac.gov.in/all-imp-news",
    table: "Retail selling price, Delhi IOCL outlet — not an all-India average",
    accessedOn: "2026-09-11",
    short: "PPAC fuel",
    notes: "Delhi outlet only. LPG not typed from this PDF.",
  },
  "mospi-cpi-2024-weights": {
    id: "mospi-cpi-2024-weights",
    title: "CPI 2024 series — Combined division-wise weights (HCES 2023-24)",
    publisher: "Ministry of Statistics and Programme Implementation",
    fiscalYear: "2024-25",
    url: "https://www.mospi.gov.in/uploads/documents/documents/1770891066052-Annexure_V.pdf",
    pages: "Annex V FAQ table — Combined CPI 2024 column (Food 36.75, Housing 17.66, Transport 8.80, Health 6.10, …)",
    table: "Division-wise weights Combined 2024 — the official basket, not observed rupees",
    accessedOn: "2026-09-11",
    short: "CPI 2024 basket",
    notes:
      "INDEX. Weights from Household Consumption Expenditure Survey 2023-24. Food share fell from 42.62 (2012 Combined) to 36.75 (2024 Combined). Pie uses the Combined 2024 column.",
  },
  "mospi-cpi-2026-07": {
    id: "mospi-cpi-2026-07",
    title: "Consumer Price Index on base 2024=100 for July 2026 (provisional)",
    publisher: "Ministry of Statistics and Programme Implementation",
    fiscalYear: "2026-27",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298247",
    pages:
      "PIB 12 Aug 2026: Combined CPI 4.45% (index 107.94); CFPI 5.52%; Potato −16.56%; Tomato −4.59%; Onion 22.54%",
    table: "All India Combined CPI / CFPI / selected item inflation — index, not a rupee",
    accessedOn: "2026-09-11",
    short: "MoSPI CPI",
    notes:
      "INDEX. Basket rebased 2012→2024. August 2026 CPI due 14 Sep 2026 — not typed. Never the hero of the inflation bulletin.",
  },
  "sk-afs-2026-27": {
    id: "sk-afs-2026-27",
    title:
      "Annual Financial Statement 2026-27 — Statement I (2055 Police / 4055 Capital Outlay on Police)",
    publisher: "Finance Department, Government of Sikkim",
    fiscalYear: "2026-27",
    url: "https://www.sikkimfred.gov.in/Budget_2026-27/Documents/AFS2026-27/Annual%20Financial%20Statement%202026-27.pdf",
    pages:
      "Statement I Revenue disbursements printed p. 4 — 2055 Police; Statement I Capital disbursements printed p. 9 — 4055 Capital Outlay on Police",
    table: "2055 Police; 4055 Capital Outlay on Police — statewide, not jails 2056",
    accessedOn: "2026-09-10",
    short: "Sikkim budget",
    notes:
      "Figures printed in thousands of rupees. Converted to crore by dividing by 10,000. Hero is 2055 + 4055. Not Vote on Account. Not a research-summary Police sector slice.",
  },
  "rj-vol2b-2026-27": {
    id: "rj-vol2b-2026-27",
    title: "Volume 2b — Revenue Expenditure, General Services 2026-27 (2055 Police सारांश)",
    publisher: "Finance Department, Government of Rajasthan",
    fiscalYear: "2026-27",
    url: "https://finance.rajasthan.gov.in/docs/budget/statebudget/2026-2027/Vol2b.pdf",
    pages: "printed p. 168 — 2055 Police सारांश, मुख्य-शीर्ष-2055 योग and वृहद योग",
    table:
      "2055 Police वृहद योग (voted + charged; State fund + Central assistance) — not jails 2056, not Budget at a Glance Police Department ₹556.16 cr",
    accessedOn: "2026-09-10",
    short: "Rajasthan Vol2b",
    notes:
      "Figures printed in thousands of rupees (रुपये सहस्र में). Converted to crore by dividing by 10,000. Four columns are State + Central. BE 2026-27 योग 1,13,79,64,74. The explanatory note on printed p. 184 restates BE 2025-26 10,74,163.84 lakh / RE 10,38,369.15 lakh / BE 2026-27 11,37,964.74 lakh.",
  },
  "rj-vol3a-2026-27": {
    id: "rj-vol3a-2026-27",
    title: "Volume 3a — Capital Expenditure 2026-27 (4055 Capital Outlay on Police सारांश)",
    publisher: "Finance Department, Government of Rajasthan",
    fiscalYear: "2026-27",
    url: "https://finance.rajasthan.gov.in/docs/budget/statebudget/2026-2027/Vol3a.pdf",
    pages: "printed p. 4 — 4055 सारांश, मुख्य-शीर्ष-4055 योग and वृहद योग",
    table: "4055 Capital Outlay on Police वृहद योग (State + Central, net after 902 recoveries)",
    accessedOn: "2026-09-10",
    short: "Rajasthan Vol3a",
    notes:
      "Rupees in thousands. BE 2026-27 योग 3,49,00,14. Explanatory note restates BE 2025-26 38,365.34 lakh / RE 31,354.13 lakh / BE 2026-27 34,900.14 lakh. 902 disaster-fund recoveries are already netted in the योग.",
  },
  "rj-vol1-2026-27": {
    id: "rj-vol1-2026-27",
    title: "Volume 1 — Summary Volume 2026-27, Schedule of Demands (Demand 18 Home)",
    publisher: "Finance Department, Government of Rajasthan",
    fiscalYear: "2026-27",
    url: "https://finance.rajasthan.gov.in/docs/budget/statebudget/2026-2027/Vol1.pdf",
    pages: "printed p. 55–56 — Demand 18 schedule (2055, 4055, 2059, 2070, 2216, 4059 and others)",
    table: "Demand 18 net voted + charged — mixed, not Police-only",
    accessedOn: "2026-09-10",
    short: "Rajasthan Demand 18",
    notes:
      "Rupees in thousands. Demand 18 net voted 1,23,93,71,24 plus charged 1,00,04 is not Police. Used only as the quieter mixed-demand figure.",
  },
  "hp-afs-2026-27": {
    id: "hp-afs-2026-27",
    title:
      "Annual Financial Statement 2026-27 — Consolidated Fund revenue and capital expenditure (2055 / 4055)",
    publisher: "Finance Department, Government of Himachal Pradesh",
    fiscalYear: "2026-27",
    url: "https://ebudget.hp.nic.in/",
    pages:
      "Consolidated Fund Revenue Account Expenditure, 2055 Police (Rs. in Lacs, printed p. 3 of 10); Capital Account Expenditure, 4055 Capital Outlay on Police (printed p. 1 of 5)",
    table: "2055 Police statewide; 4055 Capital Outlay on Police — not Demand 07 mixed, not jails 2056",
    accessedOn: "2026-09-10",
    short: "Himachal Pradesh budget",
    notes:
      "Figures printed in lakhs of rupees. Converted to crore by dividing by 100. Books open from ebudget.hp.nic.in ReportViewer (lnkRV_X / lnkC_X) for FY 2026-27. Hero is 2055 + 4055. 2055 sits across Demands 05, 07, 31 and 32; Demand 07 alone is not the statewide line.",
  },
  "hp-d07-2026-27": {
    id: "hp-d07-2026-27",
    title: "Demand 07 Police and Allied Organisations 2026-27 — Demand Note (revenue + capital)",
    publisher: "Finance Department, Government of Himachal Pradesh",
    fiscalYear: "2026-27",
    url: "https://ebudget.hp.nic.in/",
    pages: "Demand Note 07 — revenue 174838.69 lakh + capital 338.00 lakh",
    table: "Demand 07 Police and Allied Organisations — mixed (2055, 2056 jails, 2070, 2216, 4055)",
    accessedOn: "2026-09-10",
    short: "Himachal Police and Allied grant",
    notes:
      "Rupees in lakhs. Demand 07 total BE 2026-27 175176.69 is not Police. Matches Appropriation Act Demand 07 rupees. Used only as the quieter mixed-grant figure.",
  },
  "br-afs-2026-27": {
    id: "br-afs-2026-27",
    title:
      "Annual Financial Statement of the Government of Bihar for 2026-2027 — Statement I (2055 / 4055)",
    publisher: "Finance Department, Government of Bihar",
    fiscalYear: "2026-27",
    url: "https://betastate.bihar.gov.in/file_2/FileUpload/2026/Feb/26-Feb-2026/5/DyPage/Annual%20Financial%20Statement_Report_2026-27.pdf",
    pages:
      "Statement I Revenue disbursements printed p. 5 — 2055 Police; Statement I Capital disbursements printed p. 10 — 4055 Capital Outlay on Police",
    table: "2055 Police; 4055 Capital Outlay on Police — statewide, not jails 2056, not Demand 22 mixed",
    accessedOn: "2026-09-10",
    short: "Bihar budget",
    notes:
      "Figures printed in lakhs of rupees (In Lacs of Rupees). Converted to crore by dividing by 100. Hero is 2055 + 4055. budget.bihar.gov.in still lists 2025-26; the live 2026-27 AFS is on the Finance Department Budget tab.",
  },
  "br-dfg-2026-27": {
    id: "br-dfg-2026-27",
    title: "Demands for Grants 2026-27 — Demand No. 22 Home Department",
    publisher: "Finance Department, Government of Bihar",
    fiscalYear: "2026-27",
    url: "https://betastate.bihar.gov.in/file_2/FileUpload/2026/Feb/26-Feb-2026/5/DyPage/Demands%20For%20Grants_Report_2026-27.pdf",
    pages: "Demand 22 Home — I. Estimates grand total (revenue + capital voted)",
    table: "Demand 22 Home — mixed (2055, 2056 jails, 4055, 4059 public works)",
    accessedOn: "2026-09-10",
    short: "Bihar Home demand",
    notes:
      "Rupees in lakhs. Demand 22 grand total BE 2026-27 2013286.69 is not Police. Demand 22 4055 is smaller than AFS statewide 4055. Used only as the quieter mixed-demand figure.",
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

const NCRB_BOOKS: { id: string; title: string; url: string; table: string; year: string; short: string }[] = [
  {
    id: "ncrb-cii-2022-1-2",
    title: "Crime in India 2022 — Table 1.2, IPC Crimes (Crime Head-wise), 2020–2022",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701859959TABLE12.xlsx",
    table: "Table 1.2",
    year: "2022",
    short: "Table 1.2",
  },
  {
    id: "ncrb-cii-2022-1a4",
    title: "Crime in India 2022 — Table 1A.4, IPC Crimes (Crime Head-wise and State/UT-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701860903TABLE1A4.xlsx",
    table: "Table 1A.4",
    year: "2022",
    short: "Table 1A.4",
  },
  {
    id: "ncrb-cii-2022-1b4",
    title: "Crime in India 2022 — Table 1B.4, IPC Crimes (Crime Head-wise and City-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701926426TABLE1B4.xlsx",
    table: "Table 1B.4",
    year: "2022",
    short: "Table 1B.4",
  },
  {
    id: "ncrb-cii-2022-2a1",
    title: "Crime in India 2022 — Table 2A.1, Murder Cases (State/UT-wise), 2020–2022",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701932716TABLE2A1.xlsx",
    table: "Table 2A.1",
    year: "2022",
    short: "Table 2A.1",
  },
  {
    id: "ncrb-cii-2022-2a2",
    title: "Crime in India 2022 — Table 2A.2, Motives of Murder",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701932846TABLE2A2.xlsx",
    table: "Table 2A.2",
    year: "2022",
    short: "Table 2A.2",
  },
  {
    id: "ncrb-cii-2022-2a3",
    title: "Crime in India 2022 — Table 2A.3, Victims of Murder (Gender and Age)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701932884TABLE2A3.xlsx",
    table: "Table 2A.3",
    year: "2022",
    short: "Table 2A.3",
  },
  {
    id: "ncrb-cii-2022-2b1",
    title: "Crime in India 2022 — Table 2B.1, Murder Cases (City-wise), 2020–2022",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701933379TABLE2B1.xlsx",
    table: "Table 2B.1",
    year: "2022",
    short: "Table 2B.1",
  },
  {
    id: "ncrb-cii-2022-3a2",
    title: "Crime in India 2022 — Table 3A.2, Crimes against Women (Crime Head-wise and State/UT-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701935197TABLE3A2.xlsx",
    table: "Table 3A.2",
    year: "2022",
    short: "Table 3A.2",
  },
  {
    id: "ncrb-cii-2022-3a3",
    title: "Crime in India 2022 — Table 3A.3, Women and Girls Victims of Rape (Age Group-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701935237TABLE3A3.xlsx",
    table: "Table 3A.3",
    year: "2022",
    short: "Table 3A.3",
  },
  {
    id: "ncrb-cii-2022-3a4",
    title: "Crime in India 2022 — Table 3A.4, Offenders’ Relation to Victims of Rape",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701935296TABLE3A4.xlsx",
    table: "Table 3A.4",
    year: "2022",
    short: "Table 3A.4",
  },
  {
    id: "ncrb-cii-2022-3b2",
    title: "Crime in India 2022 — Table 3B.2, Crimes against Women (Crime Head-wise and City-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701940114TABLE3B2.xlsx",
    table: "Table 3B.2",
    year: "2022",
    short: "Table 3B.2",
  },
  {
    id: "ncrb-cii-2022-17a1",
    title: "Crime in India 2022 — Table 17A.1, Police Disposal of IPC Crime Cases (Crime Head-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1702042449TABLE17A1.xlsx",
    table: "Table 17A.1",
    year: "2022",
    short: "Table 17A.1",
  },
  {
    id: "ncrb-cii-2022-18a1",
    title: "Crime in India 2022 — Table 18A.1, Court Disposal of IPC Crime Cases (Crime Head-wise)",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1702040446TABLE18A1.xlsx",
    table: "Table 18A.1",
    year: "2022",
    short: "Table 18A.1",
  },
  {
    id: "ncrb-cii-2022-20a1",
    title: "Crime in India 2022 — Table 20A.1, Value of Property Stolen and Recovered",
    url: "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1702035135TABLE20A1.xlsx",
    table: "Table 20A.1",
    year: "2022",
    short: "Table 20A.1",
  },
  {
    id: "ncrb-cii-2022-limits",
    title: "Crime in India 2022 — Disclaimer and limitations",
    url: "https://www.ncrb.gov.in/uploads/files/031.pdf",
    table: "Limitations 1–3",
    year: "2022",
    short: "Limits",
  },
  {
    id: "ncrb-cii-2023-snapshot",
    title: "Crime in India 2023 — Snapshots (States/UTs)",
    url: "https://www.ncrb.gov.in/uploads/files/9ACII2023Snapshots-StateandUTs4.pdf",
    table: "National snapshot",
    year: "2023",
    short: "Snapshot",
  },
  ...(
    [
      ["1-2", "Table 1.2", "IPC Crimes (Crime Head-wise), 2021–2023"],
      ["1a4", "Table 1A.4", "IPC Crimes (Crime Head-wise and State/UT-wise)"],
      ["1b4", "Table 1B.4", "IPC Crimes (Crime Head-wise and City-wise)"],
      ["2a1", "Table 2A.1", "Murder Cases (State/UT-wise), 2021–2023"],
      ["2a2", "Table 2A.2", "Motives of Murder"],
      ["2a3", "Table 2A.3", "Victims of Murder (Gender and Age Group-wise)"],
      ["2b1", "Table 2B.1", "Murder Cases in Metropolitan Cities, 2021–2023"],
      ["3a2", "Table 3A.2", "Crimes against Women (Crime Head-wise and State/UT-wise)"],
      ["3a3", "Table 3A.3", "Women and Girls Victims of Rape (Age Group-wise)"],
      ["3a4", "Table 3A.4", "Offenders’ Relation to Victims of Rape"],
      ["3a5", "Table 3A.5", "Police Disposal of Crime against Women"],
      ["3a7", "Table 3A.7", "Court Disposal of Crime against Women"],
      ["3a11", "Table 3A.11", "Cases Registered under Rape (Section-wise)"],
      ["3b2", "Table 3B.2", "Crimes against Women (Crime Head-wise and City-wise)"],
      ["4a10", "Table 4A.10", "Offenders’ Relation to Child Victims of POCSO Act (Sections 4 and 6)"],
      ["limits", "Limitations and methodology", "Principal Offence Rule and population base"],
    ] as const
  ).map(([key, table, name]) => ({
    id: `ncrb-cii-2023-${key}`,
    title: `Crime in India 2023, Volume I — ${table}, ${name}`,
    url: "https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2023PartI.pdf",
    table,
    year: "2023",
    short: table.startsWith("Table") ? `2023 ${table}` : "2023 limits",
  })),
  ...(
    [
      ["1-2", "Table 1.2", "IPC/BNS Crimes (Crime Head-wise), 2022–2024"],
      ["1a4", "Table 1A.4", "IPC/BNS Crimes (Crime Head-wise and State/UT-wise)"],
      ["1b4", "Table 1B.4", "IPC/BNS Crimes (Crime Head-wise and City-wise)"],
      ["2a1", "Table 2A.1", "Murder Cases (State/UT-wise), 2022–2024"],
      ["2a2", "Table 2A.2", "Motives of Murder"],
      ["2a3", "Table 2A.3", "Victims of Murder (Gender and Age Group-wise)"],
      ["2b1", "Table 2B.1", "Murder Cases in Metropolitan Cities, 2022–2024"],
      ["3a2", "Table 3A.2", "Crimes against Women (Crime Head-wise and State/UT-wise)"],
      ["3a3", "Table 3A.3", "Women and Girls Victims of Rape (Age Group-wise)"],
      ["3a4", "Table 3A.4", "Offenders’ Relation to Victims of Rape"],
      ["3a5", "Table 3A.5", "Police Disposal of Crime against Women"],
      ["3a7", "Table 3A.7", "Court Disposal of Crime against Women"],
      ["3a11", "Table 3A.11", "Cases Registered under Rape (Section-wise)"],
      ["3b2", "Table 3B.2", "Crimes against Women (Crime Head-wise and City-wise)"],
      ["4a10", "Table 4A.10", "Offenders’ Relation to Child Victims of POCSO Act (Sections 4 and 6)"],
      ["limits", "Limitations and methodology", "Principal Offence Rule and population base"],
    ] as const
  ).map(([key, table, name]) => ({
    id: `ncrb-cii-2024-${key}`,
    title: `Crime in India 2024, Volume I — ${table}, ${name}`,
    url: "https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2024-VolumeI.pdf",
    table,
    year: "2024",
    short: table.startsWith("Table") ? `2024 ${table}` : "2024 limits",
  })),
];

for (const book of NCRB_BOOKS) {
  citations[book.id] = {
    id: book.id,
    title: book.title,
    publisher: "National Crime Records Bureau, Ministry of Home Affairs",
    fiscalYear: book.year,
    url: book.url,
    table: book.table,
    accessedOn: "2026-09-27",
    short: book.short,
    notes: "Calendar year. Registered cases, principal-offence rule.",
  };
}

const NCRB_VOLUMES: [string, string, string, string][] = [
  ["ncrb-cii-2016-vol", "2016", "Crime in India 2016 — full publication", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1653886924_Crime%20in%20India%20-%202016%20Complete%20PDF%20291117.pdf"],
  ["ncrb-cii-2017-v1", "2017", "Crime in India 2017 — Volume I", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1653885627_Crime%20in%20India%202017%20-%20Volume%201_0_0.pdf"],
  ["ncrb-cii-2018-v1", "2018", "Crime in India 2018 — Volume I", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1653734481_Crime%20in%20India%202018%20-%20Volume%201_3_0_0.pdf"],
  ["ncrb-cii-2019-v1", "2019", "Crime in India 2019 — Volume I", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1653730573_CII%202019%20Volume%201.pdf"],
  ["ncrb-cii-2020-v1", "2020", "Crime in India 2020 — Volume I", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/post/16959885631653645869CII2020Volume1.pdf"],
  ["ncrb-cii-2021-v1", "2021", "Crime in India 2021 — Volume I", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/post/1679310394CII2021Volume1.pdf"],
  ["ncrb-cii-2022-v1", "2022", "Crime in India 2022 — Volume I", "https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701607577CrimeinIndia2022Book1.pdf"],
  ["ncrb-cii-2024-v1", "2024", "Crime in India 2024 — Volume I", "https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2024-VolumeI.pdf"],
];
for (const [id, year, title, url] of NCRB_VOLUMES) {
  citations[id] = {
    id,
    title: `${title}, Tables 1.2, 3A.2 and 3A.11`,
    publisher: "National Crime Records Bureau, Ministry of Home Affairs",
    fiscalYear: year,
    url,
    table: "Tables 1.2, 3A.2, 3A.11",
    accessedOn: "2026-09-27",
    short: `CII ${year}`,
    notes: "Calendar year. Registered cases, principal-offence rule.",
  };
}

citations["mha-rs-390-2025"] = {
  id: "mha-rs-390-2025",
  title: "Rajya Sabha Unstarred Question No. 390, Crimes against Women and Children (3 December 2025)",
  publisher: "Ministry of Home Affairs",
  fiscalYear: "2021-2023",
  url: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2025-pdfs/RS03122025/390.pdf",
  table: "Annexure: crime head-wise cases, 2021–2023",
  accessedOn: "2026-09-27",
  short: "RS Q390",
  notes: "Prints rape 31,677 / 31,516 / 29,670 and total crime against women as IPC plus SLL (POCSO) rows added.",
};

citations["mha-ls-2263-2022"] = {
  id: "mha-ls-2263-2022",
  title: "Lok Sabha Unstarred Question No. 2263, Crime against Women and Minor Girls (20 December 2022)",
  publisher: "Ministry of Home Affairs",
  fiscalYear: "2018-2021",
  url: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2022-pdfs/LS-20122022/2263.pdf",
  table: "Annexures I and II: rape and gang rape (s.376D), 2018–2021",
  accessedOn: "2026-09-27",
  short: "LS Q2263",
  notes: "Uses NCRB's revised 2019 figures (32,032 rapes, 1,962 gang rapes).",
};

citations["mha-rs-3734-2023"] = {
  id: "mha-rs-3734-2023",
  title: "Rajya Sabha Unstarred Question No. 3734, Murder Rate across the States (5 April 2023)",
  publisher: "Ministry of Home Affairs",
  fiscalYear: "2017-2021",
  url: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2023-pdfs/RS05042023/3734.pdf",
  table: "Annexure I: murder cases and rate, 2017–2021",
  accessedOn: "2026-09-27",
  short: "RS Q3734",
  notes: "Prints 28,653 / 29,017 / 28,915 / 29,193 / 29,272, using NCRB's revised 2019 figure.",
};

citations["mha-ls-1954-2025"] = {
  id: "mha-ls-1954-2025",
  title: "Lok Sabha Unstarred Question No. 1954, Murder Cases (11 March 2025)",
  publisher: "Ministry of Home Affairs",
  fiscalYear: "2020-2022",
  url: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2025-pdfs/LS11032025/1954.pdf",
  table: "Annexure I: murder cases, 2020–2022",
  accessedOn: "2026-09-27",
  short: "LS Q1954",
};

citations["delhi-police-mvt"] = {
  id: "delhi-police-mvt",
  title: "Delhi Police — Motor Vehicle Theft e-FIR portal",
  publisher: "Delhi Police, Government of NCT of Delhi (Ministry of Home Affairs)",
  fiscalYear: "2015-",
  url: "https://mvt.delhipolice.gov.in/",
  accessedOn: "2026-09-27",
  short: "Delhi e-FIR",
  notes: "Online registration of motor-vehicle theft FIRs; the portal carries a 2015 copyright line.",
};

citations["pib-ftsc-2025-08"] = {
  id: "pib-ftsc-2025-08",
  title: "Scheme of Fast Track Special Courts (press release 2154103, 8 August 2025)",
  publisher: "Press Information Bureau, Ministry of Law and Justice",
  fiscalYear: "2025",
  url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2154103",
  table: "Courts functional and cumulative disposal as on 30.06.2025",
  accessedOn: "2026-09-27",
  short: "PIB 8 Aug 2025",
  notes: "Figures as received from High Courts. Jharkhand left the scheme on 07.07.2025.",
};

citations["pib-ftsc-2025-03"] = {
  id: "pib-ftsc-2025-03",
  title: "Swift Justice, Safer Society: The Impact of Fast Track Special Courts (press release 2113344, 20 March 2025)",
  publisher: "Press Information Bureau, Ministry of Law and Justice",
  fiscalYear: "2024",
  url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2113344",
  table: "Cases instituted and disposed, 2024",
  accessedOn: "2026-09-27",
  short: "PIB 20 Mar 2025",
  notes: "The release prints both 745 and 754 as the number of functional courts.",
};

citations["doj-ftsc-dashboard"] = {
  id: "doj-ftsc-dashboard",
  title: "Fast Track Special Courts dashboard — Pendency by the FTSCs",
  publisher: "Department of Justice, Ministry of Law and Justice",
  fiscalYear: "2026",
  url: "https://dashboard.doj.gov.in/fast-track-special-court/pendency_by_ftsc",
  table: "State/UT-wise pendency",
  accessedOn: "2026-09-27",
  short: "DoJ FTSC dashboard",
  notes: "Live dashboard read on 2026-09-27; it shows no as-on date.",
};

citations["ncw-complaint-stats"] = {
  id: "ncw-complaint-stats",
  title: "Statistical Overview of Complaints (nature-wise), 2019–2025",
  publisher: "National Commission for Women",
  fiscalYear: "2019-2025",
  url: "https://ncwapps.nic.in/frmComp_stat_Overview.aspx",
  table: "Nature-wise complaints by year",
  accessedOn: "2026-09-27",
  short: "NCW complaints",
  notes: "Complaints received by the Commission, not FIRs. Categories changed in 2019.",
};

citations["mha-ls-2055-2023"] = {
  id: "mha-ls-2055-2023",
  title: "Lok Sabha Unstarred Question No. 2055, Custodial Deaths (1 August 2023)",
  publisher: "Ministry of Home Affairs",
  fiscalYear: "2018-2023",
  url: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2023-pdfs/LS-01082023/2055.pdf",
  table: "Cases registered by NHRC on deaths in police custody, 2018-19 to 2022-23",
  accessedOn: "2026-09-27",
  short: "LS Q2055",
  notes: "NHRC cases, by financial year.",
};

citations["mha-ls-1459-2022"] = {
  id: "mha-ls-1459-2022",
  title: "Lok Sabha Unstarred Question No. 1459, Custodial Deaths and Fake Encounters (26 July 2022)",
  publisher: "Ministry of Home Affairs",
  fiscalYear: "2020-2022",
  url: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2022-pdfs/LS26072022/1459.pdf",
  table: "NHRC cases on custodial deaths and deaths in police encounters, 2020-21 and 2021-22",
  accessedOn: "2026-09-27",
  short: "LS Q1459",
  notes: "NHRC cases, by financial year.",
};

citations["kerala-police-stats"] = {
  id: "kerala-police-stats",
  title: "Crime statistics — BNS/IPC cases and crime against women, state-wide",
  publisher: "Kerala Police, Government of Kerala",
  fiscalYear: "2020-2026",
  url: "https://keralapolice.gov.in/crime-statistics/ipc-cases",
  table: "State-wide crime heads by year",
  accessedOn: "2026-09-27",
  short: "Kerala Police",
  notes: "Also https://keralapolice.gov.in/crime-statistics/crime-against-woman. Live pages read on 2026-09-27.",
};

citations["pib-mha-2015-marital"] = {
  id: "pib-mha-2015-marital",
  title: "Women Subjected to Marital Rape (29 April 2015)",
  publisher: "Press Information Bureau, Ministry of Home Affairs",
  fiscalYear: "2015",
  url: "https://www.pib.gov.in/newsite/printrelease.aspx?relid=119938",
  table: "Statement on the Law Commission's 172nd Report and CEDAW",
  accessedOn: "2026-09-27",
  short: "PIB 29 Apr 2015",
};

citations["sc-independent-thought-2017"] = {
  id: "sc-independent-thought-2017",
  title: "Independent Thought v. Union of India, W.P.(C) 382 of 2013, judgment of 11 October 2017",
  publisher: "Supreme Court of India (copy hosted by Rajasthan Police Academy, Government of Rajasthan)",
  fiscalYear: "2017",
  url: "https://home.rajasthan.gov.in/content/dam/homeportal/RajasthanPoliceAcademy/PDF/IndependentThoughtVsUnionofIndia.PDF",
  table: "Relief, paras 87–88",
  accessedOn: "2026-09-27",
  short: "SC 2017",
  notes: "Exception 2 to s.375 read down for wives under 18, prospectively.",
};

citations["nhrc-custody-guidelines"] = {
  id: "nhrc-custody-guidelines",
  title: "Selected NHRC guidelines on custodial deaths and rapes",
  publisher: "National Human Rights Commission, as posted by the Ministry of Home Affairs",
  fiscalYear: "1993-2019",
  url: "https://www.mha.gov.in/sites/default/files/2025-04/NHRCselectedlettersandguidelinesondeathsincustody_09042019_0%5B1%5D_4.pdf",
  table: "Letter to all Chief Secretaries on reporting custodial deaths within 24 hours",
  accessedOn: "2026-09-27",
  short: "NHRC guidelines",
};

citations["ksp-cik-2024"] = {
  id: "ksp-cik-2024",
  title: "Crime in Karnataka – 2024 (21st edition)",
  publisher: "Karnataka State Police, Police Computer Wing and State Crime Records Bureau, Government of Karnataka",
  fiscalYear: "2022-2024",
  url: "https://ksp.karnataka.gov.in/storage/pdf-files/Crime_In_Karnataka_2024.pdf",
  table: "IPC/BNS crimes by head, 2022–2024; disposal of POCSO cases",
  accessedOn: "2026-09-27",
  short: "Crime in Karnataka 2024",
  notes: "Year-wise reports 2015–2024 are listed at https://ksp.karnataka.gov.in/new-page/Crime%20in%20Karnataka/en.",
};

citations["nfhs5-india-ch15"] = {
  id: "nfhs5-india-ch15",
  title: "National Family Health Survey (NFHS-5), 2019–21, India Report — Chapter 15, Domestic Violence",
  publisher: "International Institute for Population Sciences, Ministry of Health and Family Welfare",
  fiscalYear: "2019-21",
  url: "https://dhsprogram.com/pubs/pdf/FR375/FR375.pdf",
  pages: "641–675",
  table: "Tables 15.4, 15.6, 15.9, 15.17, 15.18",
  accessedOn: "2026-09-27",
  short: "NFHS-5 ch. 15",
  notes:
    "Government of India publication (Ministry of Health and Family Welfare; IIPS, Mumbai). No full copy is currently online on a government host: the IIPS and Ministry links returned 404 on 2026-09-27, so this links the identical report as deposited with the DHS Program.",
};

citations["bns-2023-s63"] = {
  id: "bns-2023-s63",
  title: "Bharatiya Nyaya Sanhita, 2023 (Act 45 of 2023) — Section 63, Exception 2",
  publisher: "Ministry of Law and Justice, Gazette of India Extraordinary, as posted by the Ministry of Home Affairs",
  fiscalYear: "2023",
  url: "https://www.mha.gov.in/sites/default/files/250883_english_01042024.pdf",
  table: "Section 63, Exception 2",
  accessedOn: "2026-09-27",
  short: "BNS s.63",
  notes: "In force from 1 July 2024. Section 375 of the Indian Penal Code, under which the 2022 and 2023 cases were registered, carried the same exception.",
};

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
