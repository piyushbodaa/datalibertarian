/**
 * What each headline count is made of, 2024, plus the large parts that sit outside it.
 * Crime in India 2024, Volume I (NCRB): Table 1.2 (heads), 2A.2 (motives), 3A.4 and 4A.10
 * (offender relation). NFHS-5 India Report, Tables 15.6 and 15.9 (survey, 2019–21).
 * Accessed 2026-09-27. Every part below is a printed figure; shares are computed on the page.
 */
export const composition2024 = {
  year: 2024,
  rape: {
    s376: 29536,
    gangRape: 1507,
    pocsoGirls: 43313,
    relation: { family: 2134, friendsOrPartners: 13879, otherKnown: 12584, unknown: 939, total: 29536 },
    pocsoRelation: { family: 3658, otherKnown: 16668, friendsOrPartners: 22308, unknown: 1492, total: 44126 },
  },
  murder: {
    cases: 27049,
    /** Table 2A.2 all-India row. "Other causes" and "no motive known" are printed rows, not a residual. */
    motives: { disputes: 9607, otherCauses: 7079, vendetta: 3638, loveAffairs: 1391, illicit: 1411, gain: 1460, noMotiveKnown: 1261 },
    /** Killings and deaths recorded under other heads, not inside the murder count. */
    outside: { dowryDeaths: 5737, culpableHomicide: 3868 },
  },
  robbery: {
    robbery: 23145,
    dacoity: 2393,
    /** New BNS head from 1 July 2024; under the IPC these were filed as theft or robbery. */
    snatching: 12644,
  },
  theft: {
    total: 621945,
    vehicle: 233033,
    household: 29813,
    fromVehicles: 5643,
    idol: 465,
    government: 1037,
    byServant: 1516,
    other: 350438,
  },
} as const;

/** NFHS-5 (2019–21), women aged 18–49. Survey percentages, not case counts. */
export const nfhsSexualViolence = {
  /** Table 15.6, total column: among women who experienced sexual violence, who they named. More than one answer allowed. */
  perpetrators: [
    { label: "Current husband", pct: 78.7 },
    { label: "Former husband", pct: 13.2 },
    { label: "Other relative", pct: 3.8 },
    { label: "Current or former boyfriend", pct: 2.2 },
    { label: "Own friend or acquaintance", pct: 1.1 },
    { label: "Father or step-father", pct: 1.0 },
    { label: "Family friend", pct: 0.8 },
    { label: "Brother or step-brother", pct: 0.7 },
    { label: "Stranger", pct: 0.4 },
  ],
  /** Table 15.9: ever-married women 18–49, by their husband. */
  spousal: {
    anySexualEver: 6.3,
    anySexualPast12Months: 5.2,
    forcedIntercourseEver: 4.6,
    forcedIntercoursePast12Months: 3.9,
  },
} as const;
