/**
 * Rape FIRs by kind, 2015–2024, each year read from that year's own Crime in India volume
 * (National Crime Records Bureau). Accessed 2026-09-27.
 *
 *   s376        Rape row, section 376 IPC (2024: IPC s.376 + BNS ss.64–71, as the volume totals them). Table 3A.2 / 1.2.
 *   gangRape    Gang rape, section 376D IPC (2024: BNS s.70(1)). Table 3A.11 (2016: 3A.2 col. 27B).
 *               Gang rape of girls under 16 or 12 (s.376DA, 376DB from 2018; BNS 70(2) in 2024) stays in
 *               "other s.376": 0 to 84 cases a year.
 *   pocsoGirls  Child rape, POCSO sections 4 & 6, girl victims. Table 3A.2(ii). Separate row from 2017.
 *
 * Before 2017 the rape row included child rape filed under POCSO 4 & 6 read with s.376
 * (2016 volume, Table 3A.2(i) note), so 2015 and 2016 have no separate POCSO figure.
 * 2015's own volume is not posted in full on ncrb.gov.in; its total comes from Table 1.2 of
 * the 2016 and 2017 volumes, which print the same 34,651, and it has no gang-rape split here.
 */
export type RapeYear = {
  year: number;
  s376: number;
  gangRape: number | null;
  pocsoGirls: number | null;
  /** True when the s.376 row itself includes POCSO child rape (before 2017). */
  pocsoInside: boolean;
  source: string;
  note?: string;
};

export const rapeSeries: RapeYear[] = [
  { year: 2015, s376: 34651, gangRape: null, pocsoGirls: null, pocsoInside: true, source: "ncrb-cii-2016-vol" },
  { year: 2016, s376: 38947, gangRape: 2167, pocsoGirls: null, pocsoInside: true, source: "ncrb-cii-2016-vol" },
  { year: 2017, s376: 32559, gangRape: 1874, pocsoGirls: 17382, pocsoInside: false, source: "ncrb-cii-2017-v1" },
  { year: 2018, s376: 33356, gangRape: 1826, pocsoGirls: 21401, pocsoInside: false, source: "ncrb-cii-2018-v1" },
  {
    year: 2019,
    s376: 32033,
    gangRape: 1931,
    pocsoGirls: 25934,
    pocsoInside: false,
    source: "ncrb-cii-2019-v1",
    note: "Later NCRB tables revise 2019 to 32,032 rapes and 1,962 gang rapes, after West Bengal\u2019s late 2019 data replaced its 2018 figures; this is the 2019 volume as first printed.",
  },
  { year: 2020, s376: 28046, gangRape: 1933, pocsoGirls: 27807, pocsoInside: false, source: "ncrb-cii-2020-v1" },
  { year: 2021, s376: 31677, gangRape: 2200, pocsoGirls: 33036, pocsoInside: false, source: "ncrb-cii-2021-v1" },
  { year: 2022, s376: 31516, gangRape: 2118, pocsoGirls: 37511, pocsoInside: false, source: "ncrb-cii-2022-v1" },
  { year: 2023, s376: 29670, gangRape: 1753, pocsoGirls: 40046, pocsoInside: false, source: "ncrb-cii-2023-3a11" },
  {
    year: 2024,
    s376: 29536,
    gangRape: 1507,
    pocsoGirls: 43313,
    pocsoInside: false,
    source: "ncrb-cii-2024-v1",
    note: "19,683 under IPC s.376 and 9,853 under BNS, which replaced it from 1 July 2024.",
  },
];
