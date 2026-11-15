const inIntFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function isNum(v: number | null | undefined): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

/** Format integer with Indian digit grouping (e.g., 158944 -> "1,58,944"). Null -> "—". */
export function fmtInt(v: number | null | undefined): string {
  if (!isNum(v)) return "—";
  return inIntFmt.format(Math.round(v));
}

/**
 * Format duration in whole days with zero raw decimal clutter:
 *  - null/undefined -> "—"
 *  - 0 -> "0 days"
 *  - 0 < v < 1 -> "< 1 day"
 *  - >= 1 -> "155 days" (or "1 day")
 */
export function fmtDays(v: number | null | undefined, withUnit = true): string {
  if (!isNum(v)) return "—";
  if (v <= 0) return withUnit ? "0 days" : "0";
  if (v < 1) return withUnit ? "< 1 day" : "< 1";
  const r = Math.round(v);
  if (!withUnit) return inIntFmt.format(r);
  return `${inIntFmt.format(r)} ${r === 1 ? "day" : "days"}`;
}

/** Whole-number percentage (e.g., 61.3 -> "61%"). Null -> "—". */
export function fmtPct(v: number | null | undefined): string {
  if (!isNum(v)) return "—";
  return `${Math.round(v)}%`;
}

/** Format ISO UTC timestamp to clean calendar date (e.g., "4 May 2024"). */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const y = m[1];
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12) return iso.slice(0, 10);
  return `${d} ${months[mo - 1]} ${y}`;
}

/** Plain-English human labels — never expose raw PARIVESH enum codes as primary UI labels. */
export const PLAIN_HEADLINE_LABELS: Record<string, { label: string; note: string }> = {
  factories_ec_granted: {
    label: "Factories",
    note: "Environmental clearance · metals, cement, chemicals, refineries & manufacturing",
  },
  factories_tor_bespoke_granted: {
    label: "Factories — scoping approval",
    note: "Committee-appraised terms of reference before environmental study",
  },
  factories_tor_auto_granted: {
    label: "Factories — standard scoping",
    note: "Online standard terms of reference",
  },
  mines_major_ec_granted: {
    label: "Major mines",
    note: "Environmental clearance · coal and large mineral mines (excluding small quarries)",
  },
  mines_coal_ec_granted: {
    label: "Coal mines",
    note: "Environmental clearance · coal mining and washeries",
  },
  mines_noncoal_major_ec_granted: {
    label: "Large non-coal mines",
    note: "Environmental clearance · iron ore, limestone, bauxite & major minerals",
  },
  mines_form2_minor_ec_granted: {
    label: "Small quarries (under 5 ha)",
    note: "State-level sand, stone & minor mineral leases",
  },
  power_gen_ec_granted: {
    label: "Thermal & hydro power",
    note: "Environmental clearance · coal/gas power stations and river-valley dams",
  },
  power_thermal_ec_granted: {
    label: "Thermal power plants",
    note: "Environmental clearance · coal, lignite, gas & biomass generation",
  },
  power_hydro_ec_granted: {
    label: "Hydropower & pumped storage",
    note: "Environmental clearance · hydroelectric and river-valley projects",
  },
  power_grid_re_fc_wlc_granted: {
    label: "Solar, wind & power grid",
    note: "Forest & wildlife clearances (exempt from environmental clearance)",
  },
  forest_clearance_stage2_granted: {
    label: "Forest land diversion (final stage)",
    note: "All sectors · final Stage-II approval to divert forest land",
  },
  wildlife_clearance_disposed: {
    label: "Wildlife clearance",
    note: "All sectors · projects near national parks & sanctuaries",
  },
  crz_clearance_granted: {
    label: "Coastal zone clearance",
    note: "Ports, pipelines, desalination & coastal infrastructure",
  },
};

export const PLAIN_SUB_SECTOR: Record<string, string> = {
  FACTORIES_ALL: "Factories",
  IND1: "Metals, cement & paper",
  IND2: "Refineries & petrochemicals",
  IND3: "Chemicals & medicines",
  IND_ESTATES: "Industrial parks",
  FACTORIES_FC_WLC: "Factory on forest or wildlife land",
  MINES_MAJOR_ALL: "Major mines",
  CMIN: "Coal mines",
  MIN_MAJOR: "Large non-coal mines",
  MIN_FORM2_MINOR: "Small quarries (under 5 ha)",
  MINES_ALL_ROLLUP: "All mines",
  MINES_FC_WLC: "Mine on forest or wildlife land",
  POWER_GEN_ALL: "Thermal & hydro power",
  THE: "Thermal power plants",
  RIV: "Hydropower & dams",
  POWER_GRID_RENEWABLES: "Solar, wind & power grid",
  POWER_ALL_ROLLUP: "All power projects",
  CRZ_COASTAL: "Coastal projects",
  INFRA_LINEAR_OTHER: "Roads, railways & other infrastructure",
  ALL: "All projects",
};

export const PLAIN_CLEARANCE: Record<string, string> = {
  EC: "Environmental clearance",
  TOR_BESPOKE: "Scoping approval",
  TOR_STANDARD_AUTO: "Standard scoping",
  TOR_ALL: "Scoping approval",
  FC: "Forest clearance",
  FC_STAGE1: "Forest clearance (stage 1)",
  FC_STAGE2: "Forest clearance (final)",
  WLC: "Wildlife clearance",
  CRZ: "Coastal clearance",
  ALL: "All clearances",
};

export const PLAIN_TRACK_TAB: Record<string, string> = {
  central_ec_moefcc: "Union ministry (EC)",
  state_ec_seiaa: "State authorities (EC)",
  forest_clearance: "Forest clearance",
  wildlife_clearance: "Wildlife clearance",
  crz_clearance: "Coastal clearance",
};

export const PLAIN_DESK_BY_ID: Record<string, string> = {
  ec_central_scrutiny: "Initial scrutiny & question review",
  ec_central_eac: "Expert committee appraisal (EAC)",
  ec_central_dd: "Ministry division officers",
  ec_central_ms_post: "Member Secretary sign-off",
  ec_central_js: "Joint Secretary",
  ec_central_as_ss: "Additional / Special Secretary",
  ec_central_secretary: "Environment Secretary",
  ec_central_minister: "Union Environment Minister",
  ec_state_scrutiny: "State initial scrutiny & question review",
  ec_state_spcb: "Pollution board & public consultation",
  ec_state_seac: "State expert committee (SEAC)",
  ec_state_seiaa_decision: "State authority sign-off",
  fc_nodal: "State forest nodal officer",
  fc_dfo: "District forest officer (site inspection)",
  fc_cf: "Conservator of forests",
  fc_state_govt: "State government forest department",
  fc_intragov_query: "Department-to-department query loops",
  fc_iro_rec: "Union regional forest office",
  fc_moefcc_hq_fac: "Union ministry & forest committee",
  fc_minister: "Union Environment Minister",
  wlc_warden: "District wildlife warden",
  wlc_cwlw: "Chief wildlife warden",
  wlc_sbwl: "State wildlife board",
  wlc_state_govt: "State government forwarding",
  wlc_nbwl_ministry: "National wildlife board",
  crz_sczma: "State coastal authority",
  crz_intragov_query: "Department-to-department query loops",
  crz_nczma_eac: "National coastal committee",
  crz_moefcc_routing: "Ministry coastal officers",
  crz_minister: "Union Environment Minister",
};

export function plainDeskLabel(raw: string, deskId?: string): string {
  if (deskId && PLAIN_DESK_BY_ID[deskId]) return PLAIN_DESK_BY_ID[deskId];
  const s = raw.replace(/^\d+\.\s*/, "").trim();
  const map: Array<[RegExp, string]> = [
    [/intra-gov query|inter-departmental query/i, "Department-to-department query loops"],
    [/ia-iii officers/i, "Ministry coastal officers"],
    [/nczma/i, "National coastal committee"],
    [/member secretary.*post-eac/i, "Member Secretary sign-off"],
    [/ms initial|post-eds scrutiny/i, "Initial scrutiny & question review"],
    [/seiaa.*initial/i, "State initial scrutiny & question review"],
    [/spcb|public consultation/i, "Pollution board & public consultation"],
    [/state expert appraisal|\bseac\b/i, "State expert committee (SEAC)"],
    [/seiaa authority routing/i, "State authority sign-off"],
    [/expert appraisal|\beac\b/i, "Expert committee appraisal (EAC)"],
    [/deputy.*joint director|\bdd\b/i, "Ministry division officers"],
    [/joint secretary/i, "Joint Secretary"],
    [/additional.*special secretary/i, "Additional / Special Secretary"],
    [/^secretary/i, "Environment Secretary"],
    [/union minister/i, "Union Environment Minister"],
    [/state nodal officer/i, "State forest nodal officer"],
    [/divisional forest|\bdfo\b/i, "District forest officer (site inspection)"],
    [/conservator/i, "Conservator of forests"],
    [/state government.*part-5/i, "State government forwarding"],
    [/state government.*forest/i, "State government forest department"],
    [/regional office|\biro\b/i, "Union regional forest office"],
    [/central moefcc.*fac|forest wing/i, "Union ministry & forest committee"],
    [/chief wildlife warden/i, "Chief wildlife warden"],
    [/wildlife warden/i, "District wildlife warden"],
    [/state board for wildlife/i, "State wildlife board"],
    [/standing committee.*nbwl/i, "National wildlife board"],
    [/state coastal|\bsczma\b/i, "State coastal authority"],
  ];
  for (const [re, clean] of map) {
    if (re.test(s)) return clean;
  }
  return s.replace(/<->/g, "↔");
}

export function plainCohortSliceLabel(sliceId: string, fallback: string): string {
  const map: Record<string, string> = {
    All_Clean_Cohorts: "All projects",
    Factories: "Factories",
    Mines_Major: "Major mines",
    Mines_Coal: "Coal mines",
    Mines_NonCoal: "Large non-coal mines",
    Power_All: "Thermal & hydro power",
    "Central (MoEFCC)": "Union ministry projects",
    "State (SEIAA)": "State-level projects",
  };
  return map[sliceId] || fallback.replace(/\s*\([^)]*\)/g, "").replace(/->/g, "→").trim();
}

export function sumRecordOrNumber(v: number | Record<string, number> | undefined | null): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  return Object.values(v).reduce((acc, x) => acc + (typeof x === "number" ? x : 0), 0);
}
