/**
 * National lines printed in the Crime in India 2023 snapshot PDF on ncrb.gov.in.
 * State spreadsheets for 2023 were not listed on the Bureau's table page
 * on 27 September 2026, so this file has no state or city rows.
 * Accessed 2026-09-27.
 * https://www.ncrb.gov.in/uploads/files/9ACII2023Snapshots-StateandUTs4.pdf
 */
export const ncrb2023 = {
  year: 2023,
  citationId: "ncrb-cii-2023-snapshot",
  murder: { cases: 27721, priorYearCases: 28522, changePercent: -2.8 },
  murderMotives: [
    { label: "Disputes", cases: 9209 },
    { label: "Personal vendetta or enmity", cases: 3458 },
    { label: "Gain", cases: 1890 },
  ],
  theft: { cases: 689580, priorYearCases: 652731 },
  burglary: { cases: 107573 },
  propertyOffences: { cases: 878307, priorYearCases: 839252, changePercent: 4.7 },
  propertyValue: { stolenCrore: 6917.2, recoveredCrore: 2065, recoveryPercent: 29.9 },
  women: {
    cases: 448211,
    priorYearCases: 445256,
    changePercent: 0.7,
    ratePerLakhWomen: 66.2,
    priorRatePerLakhWomen: 66.4,
    cruelty: { cases: 133676, sharePercent: 29.8 },
    kidnapping: { cases: 88605, sharePercent: 19.8 },
    assaultModesty: { cases: 83891, sharePercent: 18.71 },
    pocso: { cases: 66232, sharePercent: 14.8 },
  },
  disposal: {
    murder: {
      forInvestigation: 45544,
      chargesheeted: 24575,
      chargesheetRate: 85.7,
      forTrial: 272198,
      convicted: 7181,
      convictionRate: 37.7,
    },
    rape: {
      forInvestigation: 40393,
      chargesheeted: 24582,
      chargesheetRate: 80.3,
      forTrial: 203067,
      convicted: 4464,
      convictionRate: 22.7,
    },
  },
} as const;
