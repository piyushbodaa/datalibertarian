/**
 * Figures from government bodies other than the National Crime Records Bureau, each read from
 * the body's own publication or site on 2026-09-27. Every entry names its citation id in
 * src/data/sources.ts. No figure here is estimated or derived except where a field says "computed".
 */

/** Department of Justice (Ministry of Law and Justice): Fast Track Special Courts for rape and POCSO cases. */
export const ftsc = {
  /** PIB, Ministry of Law and Justice, 8 Aug 2025 (release 2154103). */
  asOn2025_06_30: { functionalCourts: 725, exclusivePocso: 392, statesUts: 29, disposedSinceInception: 334213, source: "pib-ftsc-2025-08" },
  /** Same release: average disposals per court per month. */
  disposalPerCourtPerMonth: { ftsc: 9.51, regularCourts: 3.26, source: "pib-ftsc-2025-08" },
  /** PIB, Ministry of Law and Justice, 20 Mar 2025 (release 2113344). "Disposal rate" there is disposed ÷ instituted, not a conviction rate. */
  year2024: { instituted: 88902, disposed: 85595, source: "pib-ftsc-2025-03" },
  /** Department of Justice FTSC dashboard, "Pendency by the FTSCs", read 27 Sep 2026. Live figures; the dashboard shows no as-on date. */
  pendencyByState: [
    ["Uttar Pradesh", 98768], ["Maharashtra", 31311], ["Bihar", 24747], ["Madhya Pradesh", 11003], ["Tamil Nadu", 9201],
    ["Odisha", 8949], ["Telangana", 8861], ["Assam", 6872], ["Kerala", 6716], ["West Bengal", 6680], ["Karnataka", 5703],
    ["Andhra Pradesh", 5455], ["Gujarat", 4883], ["Haryana", 4877], ["Rajasthan", 3574], ["Delhi", 3179], ["Chhattisgarh", 1894],
    ["Uttarakhand", 1516], ["Punjab", 1276], ["Meghalaya", 1161], ["Jammu and Kashmir", 534], ["Himachal Pradesh", 451],
    ["Puducherry", 253], ["Tripura", 239], ["Chandigarh", 179], ["Goa", 157], ["Mizoram", 92], ["Manipur", 58], ["Nagaland", 44],
    ["Andaman and Nicobar", 0], ["Arunachal Pradesh", 0], ["Jharkhand", 0],
  ] as [string, number][],
  pendencySource: "doj-ftsc-dashboard",
  pendencyTotal: 248633, // computed: sum of the dashboard rows
} as const;

/** National Commission for Women, complaint statistics (nature-wise), ncwapps.nic.in. Categories changed in 2019; earlier years are not comparable. */
export const ncwComplaints = {
  source: "ncw-complaint-stats",
  years: [
    { year: 2019, rapeOrAttempt: 1339, policeApathy: 2396, dowryDeath: 373, domesticViolence: 2960, total: 19730 },
    { year: 2020, rapeOrAttempt: 1236, policeApathy: 1276, dowryDeath: 330, domesticViolence: 5297, total: 23722 },
    { year: 2021, rapeOrAttempt: 1681, policeApathy: 1552, dowryDeath: 341, domesticViolence: 6688, total: 30865 },
    { year: 2022, rapeOrAttempt: 1711, policeApathy: 1625, dowryDeath: 358, domesticViolence: 6986, total: 30957 },
    { year: 2023, rapeOrAttempt: 1539, policeApathy: 1624, dowryDeath: 310, domesticViolence: 6305, total: 28811 },
    { year: 2024, rapeOrAttempt: 1447, policeApathy: 920, dowryDeath: 299, domesticViolence: 6348, total: 25743 },
    { year: 2025, rapeOrAttempt: 1625, policeApathy: 985, dowryDeath: 240, domesticViolence: 6920, total: 27672 },
  ],
} as const;

/** National Human Rights Commission cases, as the Ministry of Home Affairs reported them to the Lok Sabha. Financial years. */
export const nhrcCustody = {
  policeCustodyDeaths: {
    source: "mha-ls-2055-2023",
    years: [
      { fy: "2018-19", cases: 136 }, { fy: "2019-20", cases: 112 }, { fy: "2020-21", cases: 100 },
      { fy: "2021-22", cases: 175 }, { fy: "2022-23", cases: 164 },
    ],
  },
  allCustodialDeaths: { source: "mha-ls-1459-2022", years: [{ fy: "2020-21", cases: 1940 }, { fy: "2021-22", cases: 2544 }] },
  policeEncounterDeaths: { source: "mha-ls-1459-2022", years: [{ fy: "2020-21", cases: 82 }, { fy: "2021-22", cases: 151 }] },
} as const;

/**
 * Kerala Police's own state-wide crime statistics (keralapolice.gov.in), set beside NCRB's Kerala rows.
 * NCRB rape = section 376 row + POCSO sections 4 & 6 (girls), the same sum these pages use.
 */
export const keralaCheck = {
  source: "kerala-police-stats",
  rows: [
    { head: "Rape", year: 2022, state: 2518, ncrb: 814 + 1704, ncrbSource: "ncrb-cii-2022-v1" },
    { head: "Rape", year: 2023, state: 2562, ncrb: 843 + 1719, ncrbSource: "ncrb-cii-2023-3a2" },
    { head: "Rape", year: 2024, state: 2901, ncrb: 940 + 1839, ncrbSource: "ncrb-cii-2024-v1" },
    { head: "Murder", year: 2022, state: 334, ncrb: 334, ncrbSource: "ncrb-cii-2022-v1" },
    { head: "Murder", year: 2023, state: 352, ncrb: 352, ncrbSource: "ncrb-cii-2023-2a1" },
    { head: "Theft", year: 2022, state: 3943, ncrb: 3943, ncrbSource: "ncrb-cii-2022-v1" },
    { head: "Theft", year: 2023, state: 4686, ncrb: 4686, ncrbSource: "ncrb-cii-2023-1a4" },
    { head: "Burglary", year: 2023, state: 2695, ncrb: 2695, ncrbSource: "ncrb-cii-2023-1a4" },
    { head: "Robbery", year: 2022, state: 821, ncrb: 821, ncrbSource: "ncrb-cii-2022-v1" },
    { head: "Robbery", year: 2023, state: 884, ncrb: 884, ncrbSource: "ncrb-cii-2023-1a4" },
    { head: "Dacoity", year: 2023, state: 75, ncrb: 75, ncrbSource: "ncrb-cii-2023-1a4" },
  ],
} as const;

/**
 * Karnataka State Police's own annual "Crime in Karnataka" reports (State Crime Records Bureau), beside NCRB's
 * Karnataka rows. Karnataka reports rape under section 376 and POCSO child rape as separate lines, as NCRB does.
 */
export const karnatakaCheck = {
  source: "ksp-cik-2024",
  rows: [
    { head: "Rape (s.376)", year: 2022, state: 595, ncrb: 595 },
    { head: "Rape (s.376)", year: 2023, state: 656, ncrb: 656 },
    { head: "Rape (s.376)", year: 2024, state: 671, ncrb: 671 },
    { head: "POCSO child rape (4 & 6)", year: 2024, state: 3269, ncrb: 3269 },
    { head: "Murder", year: 2022, state: 1404, ncrb: 1404 },
    { head: "Murder", year: 2023, state: 1322, ncrb: 1322 },
    { head: "Murder", year: 2024, state: 1228, ncrb: 1228 },
    { head: "Theft", year: 2022, state: 21067, ncrb: 21067 },
    { head: "Theft", year: 2023, state: 24966, ncrb: 24966 },
    { head: "Theft", year: 2024, state: 22396, ncrb: 22396 },
    { head: "Burglary", year: 2024, state: 5459, ncrb: 5459 },
    { head: "Robbery", year: 2022, state: 1710, ncrb: 1710 },
    { head: "Robbery", year: 2023, state: 1842, ncrb: 1842 },
    { head: "Robbery", year: 2024, state: 1567, ncrb: 1567 },
    { head: "Dacoity", year: 2024, state: 158, ncrb: 158 },
  ],
} as const;

/** The official record on the marital-rape exception, oldest first. */
export const maritalRapeRecord = [
  { when: "2000", body: "Law Commission of India, 172nd Report", finding: "Did not recommend criminalising marital rape by amending Exception 2 to section 375.", source: "pib-mha-2015-marital" },
  { when: "2015", body: "Ministry of Home Affairs, in Parliament", finding: "The UN CEDAW Committee had recommended criminalising marital rape; citing the Law Commission, there was “presently no proposal” to amend the law.", source: "pib-mha-2015-marital" },
  { when: "2017", body: "Supreme Court, Independent Thought v. Union of India", finding: "Read the exception down so it no longer covers a wife under 18; expressly did not decide marital rape of women over 18.", source: "sc-independent-thought-2017" },
  { when: "2023", body: "Parliament, Bharatiya Nyaya Sanhita, section 63", finding: "Kept the exception for a wife 18 or older.", source: "bns-2023-s63" },
] as const;
