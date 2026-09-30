/**
 * Murder and property crime, 2015–2024, each year from that year's own Crime in India volume
 * (National Crime Records Bureau): Table 1.2 for cases, Table 2A.2 for murder motives.
 * Accessed 2026-09-27. Column order in Table 2A.2 for 2017–2019 was read from the page image,
 * because the PDF text layer scrambles those headers.
 *
 * 2015 is from the 2016 and 2017 volumes (both print the same figures); its own volume is not
 * posted in full on ncrb.gov.in. 2015 and 2016 vehicle-theft splits are from the 2017 volume.
 * Murder motives before 2017 are not comparable: the 2016 table has no "disputes" group and
 * folds domestic disputes into "other causes".
 * 2024 combines IPC and Bharatiya Nyaya Sanhita cases, as the 2024 volume totals them.
 */
export type MurderYear = {
  year: number;
  cases: number;
  /** Null before 2017. Disputes include road rage / accidents on roads in every year. */
  motives: { disputes: number; vendetta: number; loveOrIllicit: number; gain: number } | null;
  source: string;
  note?: string;
};

export const murderSeries: MurderYear[] = [
  { year: 2015, cases: 32127, motives: null, source: "ncrb-cii-2016-vol" },
  { year: 2016, cases: 30450, motives: null, source: "ncrb-cii-2016-vol" },
  { year: 2017, cases: 28653, motives: { disputes: 7898 + 540, vendetta: 4660, loveOrIllicit: 1390 + 1738, gain: 2103 }, source: "ncrb-cii-2017-v1" },
  { year: 2018, cases: 29017, motives: { disputes: 9623 + 62, vendetta: 3875, loveOrIllicit: 1581 + 1658, gain: 2995 }, source: "ncrb-cii-2018-v1" },
  { year: 2019, cases: 28918, motives: { disputes: 9516 + 31, vendetta: 3833, loveOrIllicit: 1570 + 1602, gain: 2573 }, source: "ncrb-cii-2019-v1", note: "Later volumes revise 2019 to 28,915: West Bengal\u2019s 2019 data arrived late, so the 2019 volume used its 2018 figures." },
  { year: 2020, cases: 29193, motives: { disputes: 10404, vendetta: 4034, loveOrIllicit: 1443 + 1588, gain: 1876 }, source: "ncrb-cii-2020-v1" },
  { year: 2021, cases: 29272, motives: { disputes: 9765, vendetta: 3782, loveOrIllicit: 1566 + 1559, gain: 1692 }, source: "ncrb-cii-2021-v1" },
  { year: 2022, cases: 28522, motives: { disputes: 9962, vendetta: 3761, loveOrIllicit: 1401 + 1420, gain: 1884 }, source: "ncrb-cii-2022-v1" },
  { year: 2023, cases: 27721, motives: { disputes: 9209, vendetta: 3458, loveOrIllicit: 1441 + 1389, gain: 1890 }, source: "ncrb-cii-2023-2a2" },
  { year: 2024, cases: 27049, motives: { disputes: 9607, vendetta: 3638, loveOrIllicit: 1391 + 1411, gain: 1460 }, source: "ncrb-cii-2024-v1" },
];

export type PropertyYear = {
  year: number;
  vehicleTheft: number;
  otherTheft: number;
  burglary: number;
  robbery: number;
  dacoity: number;
  source: string;
  note?: string;
};

export const propertySeries: PropertyYear[] = [
  { year: 2015, vehicleTheft: 199127, otherTheft: 268706, burglary: 114123, robbery: 36188, dacoity: 3972, source: "ncrb-cii-2017-v1" },
  { year: 2016, vehicleTheft: 213765, otherTheft: 280639, burglary: 111746, robbery: 31906, dacoity: 3795, source: "ncrb-cii-2016-vol" },
  { year: 2017, vehicleTheft: 225445, otherTheft: 363613, burglary: 110711, robbery: 30742, dacoity: 3575, source: "ncrb-cii-2017-v1" },
  { year: 2018, vehicleTheft: 233727, otherTheft: 391714, burglary: 99940, robbery: 30822, dacoity: 3492, source: "ncrb-cii-2018-v1" },
  {
    year: 2019,
    vehicleTheft: 237884,
    otherTheft: 438032,
    burglary: 100897,
    robbery: 31065,
    dacoity: 3176,
    source: "ncrb-cii-2019-v1",
    note: "Later volumes revise 2019 theft to 6,74,414 and robbery to 31,052: West Bengal\u2019s 2019 data arrived late, so the 2019 volume used its 2018 figures.",
  },
  { year: 2020, vehicleTheft: 194797, otherTheft: 298375, burglary: 86223, robbery: 24107, dacoity: 2573, source: "ncrb-cii-2020-v1" },
  { year: 2021, vehicleTheft: 236795, otherTheft: 349854, burglary: 97792, robbery: 29224, dacoity: 2877, source: "ncrb-cii-2021-v1" },
  { year: 2022, vehicleTheft: 252569, otherTheft: 400162, burglary: 107222, robbery: 28356, dacoity: 2666, source: "ncrb-cii-2022-v1" },
  { year: 2023, vehicleTheft: 250630, otherTheft: 438950, burglary: 107573, robbery: 26599, dacoity: 3792, source: "ncrb-cii-2023-1-2" },
  {
    year: 2024,
    vehicleTheft: 233033,
    otherTheft: 388912,
    burglary: 107532,
    robbery: 23145,
    dacoity: 2393,
    source: "ncrb-cii-2024-v1",
    note: "Snatching, 12,644 cases, became its own head under the BNS and is not in theft or robbery here.",
  },
];
