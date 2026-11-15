export interface StatsSummary {
  n: number;
  n_weighted: number;
  mean: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  iqr: number | null;
  p90: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
}

export interface MetaSource {
  id: string;
  name: string;
  url: string;
  scope: string;
  accessed_on: string;
}

export interface RedTapeMeta {
  schema_version: string;
  is_seed: boolean;
  stage_label: string;
  generated_at_utc: string;
  snapshot_utc: string;
  accessed_on: string;
  partition_equation: string;
  coverage: {
    p2_directory_raw_total: number;
    p2_directory_clean_total: number;
    p2_hygiene_filtered_total: number;
    p2_hygiene_dummy_state_rows: number;
    p2_hygiene_test_keyword_rows: number;
    p2_timelines_crunched_n: number;
    p1_timelines_crunched_n: number;
    total_timelines_crunched_n: number;
    linked_tor_ec_cohorts_universe_n: number;
    linked_tor_ec_cohorts_crunched_n: number;
    traces_indexed_n: number;
    trace_shards_count: number;
  };
  directory_volumes_p2_clean: {
    ec_tor_total: number;
    fc_total: number;
    wlc_total: number;
    crz_total: number;
    by_target_sector: {
      Factories: { ec_tor: number; ind_estates_31: number; fc: number; wlc: number };
      Mines: { coal_ec_tor: number; noncoal_major_ec_tor: number; noncoal_form2_minor_ec_tor: number; fc: number; wlc: number };
      Power: { thermal_ec_tor: number; hydro_ec_tor: number; fc_grid_gen: number; wlc_grid_gen: number };
      Infrastructure_Other: { ec_tor: number; fc: number; wlc: number; crz: number };
    };
  };
  statutory_benchmarks: Record<string, { days: number; label: string }>;
  sources: MetaSource[];
  assertions_passed: boolean;
}

export interface MeanPartitionDays {
  wall: number | null;
  gov: number | null;
  applicant: number | null;
  interlock: number | null;
  gov_share_pct: number | null;
  applicant_share_pct: number | null;
  interlock_share_pct: number | null;
}

export interface BreakdownDays {
  gov_scrutiny: number | null;
  gov_appraisal_committee: number | null;
  gov_interdept_query: number | null;
  gov_ministry_or_state_routing: number | null;
  applicant_eds: number | null;
  applicant_ads: number | null;
  applicant_fc_compliance: number | null;
  applicant_delisted_dormant: number | null;
  interlock_ec_fc_stage1: number | null;
}

export interface StatutoryBreach {
  benchmark_days: number | null;
  benchmark_label: string | null;
  eligible_n: number;
  breach_wall_pct: number | null;
  breach_gov_only_pct: number | null;
  seiaa_over_80d_gov_pct?: number | null;
}

export interface FixedHorizonCompletion {
  eligible_60d_n: number;
  cleared_within_60d_pct: number | null;
  eligible_105d_n: number;
  cleared_within_105d_pct: number | null;
  eligible_180d_n: number;
  cleared_within_180d_pct: number | null;
  eligible_365d_n: number;
  cleared_within_365d_pct: number | null;
}

export interface HeadlineCard {
  id: string;
  label: string;
  subtitle: string;
  sector_group: string;
  sub_sector: string;
  clearance_track: string;
  authority: string;
  cohort_status: string;
  directory_universe_n: number | null;
  crunched_n: number;
  crunched_weighted_n?: number;
  wall_days: StatsSummary;
  gov_days: StatsSummary;
  applicant_days: StatsSummary;
  interlock_days: StatsSummary;
  mean_partition_days: MeanPartitionDays;
  breakdown_mean_days?: BreakdownDays;
  statutory_breach: StatutoryBreach;
  fixed_horizon_completion: FixedHorizonCompletion;
  note: string;
}

export interface StratumRow {
  stratum_id: string;
  portal: string;
  sector_group: string;
  sub_sector: string;
  clearance_track: string;
  proposal_purpose: string;
  authority: string;
  cohort_status: string;
  n: number;
  n_weighted: number;
  wall_days: StatsSummary;
  gov_days: StatsSummary;
  applicant_days: StatsSummary;
  interlock_days: StatsSummary;
  draft_prep_days?: { n: number; mean: number | null; median: number | null; p90: number | null };
  mean_partition_days: MeanPartitionDays;
  breakdown_mean_days: BreakdownDays;
  breakdown_median_days?: BreakdownDays;
  statutory_breach: StatutoryBreach;
  fixed_horizon_completion: FixedHorizonCompletion;
  pending_holder_split?: {
    with_gov_n: number;
    with_applicant_n: number;
    in_interlock_n: number;
    with_gov_pct: number | null;
  };
}

export interface Pillar1Data {
  meta: { schema_version: string; is_seed: boolean; snapshot_utc: string; total_timelines_n: number };
  headline_cards: HeadlineCard[];
  strata: StratumRow[];
}

export interface QueryRoundBucket {
  rounds_label: string;
  count: number;
  pct: number | null;
  median_wall_days: number | null;
  median_gov_days: number | null;
  median_applicant_days: number | null;
  mean_gov_days: number | null;
  mean_applicant_days: number | null;
}

export interface QueryRoundStratum {
  sector_group: string;
  sub_sector: string;
  clearance_track: string;
  authority: string;
  cohort_status: string;
  total_n: number;
  buckets: QueryRoundBucket[];
}

export interface MarginalQueryCost {
  query_type: string;
  round_number: number;
  round_label: string;
  occurrences_n: number;
  applicant_reply_days: StatsSummary;
  subsequent_gov_rescrutiny_days: StatsSummary;
  cycle_total_days: StatsSummary;
}

export interface Pillar2Data {
  meta: { schema_version: string; is_seed: boolean; snapshot_utc: string };
  eds_rounds_by_stratum: QueryRoundStratum[];
  ads_rounds_by_stratum: QueryRoundStratum[];
  marginal_cost_per_query_round: MarginalQueryCost[];
  intragov_pingpong: {
    summary_by_clearance: Array<{
      clearance_track: string;
      portal: string;
      proposals_n: number;
      proposals_with_intragov_loops_n: number;
      pct_with_intragov_loops: number | null;
      intragov_days_when_present?: StatsSummary;
      intragov_days?: StatsSummary;
      applicant_query_days_all?: StatsSummary;
      applicant_query_days?: StatsSummary;
    }>;
    directed_desk_edges: Array<{
      clearance_track: string;
      portal: string;
      from_desk: string;
      to_desk: string;
      event_count: number;
      total_days: number;
      median_days: number | null;
      mean_days: number | null;
    }>;
    notable_examples: Array<{
      proposal_no: string;
      project_name: string;
      state: string;
      clearance_track: string;
      portal: string;
      wall_days: number;
      gov_days: number;
      intragov_query_days: number;
      applicant_days: number;
      loop_count: number;
      summary: string;
    }>;
  };
}

export interface Pillar3Data {
  meta: { schema_version: string; is_seed: boolean; snapshot_utc: string };
  audit_summary: {
    caf_audited_n: number;
    granted_with_official_duration_n: number;
    direct_caf_endpoint_verified_n?: number;
    official_duration_null_n: number;
    official_duration_null_pct: number | null;
    understated_gt_1d_n: number;
    understated_gt_1d_pct: number | null;
    understated_gt_7d_n: number;
    understated_gt_7d_pct: number | null;
    total_erased_gov_days: number | null;
    erased_share_of_true_gov_pct: number | null;
    official_reported_days: StatsSummary;
    true_gov_days: StatsSummary;
    erased_gov_days: StatsSummary;
  };
  by_sector_and_authority: Array<{
    label: string;
    sector_group: string;
    authority: string;
    audited_with_duration_n: number;
    median_official_days: number | null;
    median_true_gov_days: number | null;
    median_erased_days: number | null;
    mean_official_days: number | null;
    mean_true_gov_days: number | null;
    mean_erased_days: number | null;
    understated_gt_1d_pct: number | null;
  }>;
  structural_blindspots: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
  verified_examples: Array<{
    proposal_no: string;
    project_name: string;
    proponent_name: string;
    state: string;
    sector_group: string;
    sub_sector: string;
    authority: string;
    clearance_track: string;
    status: string;
    wall_days: number;
    true_gov_days: number;
    applicant_days: number;
    moefcc_proposal_duration: number | null;
    erased_gov_days: number | null;
    understated_pct: number | null;
    eds_rounds: number;
    ads_rounds: number;
    explanation: string;
  }>;
}

export interface DeskWaterfallTrack {
  track_label: string;
  proposals_n: number;
  median_total_gov_days: number | null;
  mean_total_gov_days: number | null;
  desks: Array<{
    desk_order: number;
    desk_id: string;
    desk_label: string;
    owner: string;
    proposals_touching_n: number;
    touch_rate_pct: number | null;
    step_occurrences_n: number;
    dwell_days_when_touched: StatsSummary;
    mean_days_across_all_proposals: number | null;
    share_of_track_gov_time_pct: number | null;
  }>;
}

export interface StateLeaderboardEntry {
  state_code: string;
  state_name: string;
  is_ut: boolean;
  p2_clean_volume_total: number;
  p2_volume_by_clearance: { EC_TOR: number; FC: number; WLC: number; CRZ: number };
  timelines_crunched_n: number;
  granted_ec_substantive?: {
    n: number;
    median_wall_days: number | null;
    median_gov_days: number | null;
    median_applicant_days: number | null;
    mean_gov_days: number | null;
    p90_gov_days: number | null;
    breach_105d_wall_pct: number | null;
    breach_105d_gov_pct: number | null;
  };
  granted_ec_all?: {
    n: number;
    median_wall_days: number | null;
    median_gov_days: number | null;
    median_applicant_days: number | null;
    mean_gov_days: number | null;
    p90_gov_days: number | null;
    breach_105d_wall_pct: number | null;
    breach_105d_gov_pct: number | null;
  };
  granted_factories_ec: { n: number; median_wall_days: number | null; median_gov_days: number | null; median_applicant_days: number | null };
  granted_mines_major_ec: { n: number; median_wall_days: number | null; median_gov_days: number | null; median_applicant_days: number | null };
  granted_mines_form2_ec: { n: number; median_wall_days: number | null; median_gov_days: number | null; median_applicant_days: number | null };
  granted_power_ec: { n: number; median_wall_days: number | null; median_gov_days: number | null; median_applicant_days: number | null };
  granted_fc: { n: number; median_wall_days: number | null; median_gov_days: number | null; median_applicant_days: number | null };
  pending_active: { n: number; median_elapsed_wall_days: number | null; with_gov_pct: number | null };
  seiaa_net_gov_rating_band: string | null;
}

export interface Pillar4Data {
  meta: { schema_version: string; is_seed: boolean; snapshot_utc: string };
  desk_waterfalls: Record<string, DeskWaterfallTrack>;
  state_leaderboard: StateLeaderboardEntry[];
}

export interface CohortSummarySlice {
  slice_id: string;
  label: string;
  n: number;
  phases: {
    initial_tor_gov_days: StatsSummary;
    initial_tor_applicant_days: StatsSummary;
    pure_eia_ph_prep_gap_days: StatsSummary;
    intermediate_tor_amendment_gov_days: StatsSummary;
    intermediate_tor_amendment_app_days: StatsSummary;
    prior_returned_ec_gov_days: StatsSummary;
    prior_returned_ec_app_days: StatsSummary;
    between_ec_attempts_rework_gap_days: StatsSummary;
    final_ec_gov_days: StatsSummary;
    final_ec_applicant_days: StatsSummary;
    cohort_total_gov_days: StatsSummary;
    cohort_total_applicant_and_eia_days: StatsSummary;
    end_to_end_tor_sub_to_ec_grant_days: StatsSummary;
  };
}

export interface FeaturedLifecycleCohort {
  cohort_label: string;
  project_id: string;
  sector_group?: string;
  sub_sector?: string;
  state?: string;
  authority?: string;
  applications_in_order: string[];
  initial_tor_proposal_no: string;
  final_ec_proposal_no: string;
  initial_tor_gov_days: number;
  initial_tor_applicant_days: number;
  pure_eia_ph_prep_gap_days: number;
  intermediate_tor_amendment_gov_days: number;
  intermediate_tor_amendment_app_days: number;
  prior_returned_ec_gov_days: number;
  prior_returned_ec_app_days: number;
  between_ec_attempts_rework_gap_days: number;
  gross_tor_grant_to_final_ec_sub_days?: number;
  final_ec_gov_days: number;
  final_ec_applicant_days: number;
  end_to_end_tor_sub_to_ec_grant_days: number;
  cohort_total_gov_days: number;
  cohort_total_applicant_and_eia_days: number;
}

export interface AnnualTrendRow {
  year: number;
  portal_era: string;
  sector_group: string;
  clearance_track: string;
  is_right_censored_filing_year: boolean;
  p2_directory_filings_n?: number | null;
  directory_filings_n?: number | null;
  crunched_filings_n: number;
  crunched_granted_n: number;
  completed_wall_days: StatsSummary;
  completed_gov_days: StatsSummary;
  completed_applicant_days: StatsSummary;
  breach_statutory_pct?: number | null;
  cleared_within_180d_pct: number | null;
  cleared_within_365d_pct: number | null;
}

export interface HistoricalBenchmarkBlock {
  valid_non_null?: number;
  non_negative_n?: number;
  overall_median: number | null;
  overall_mean: number | null;
  overall_p90?: number | null;
  pct_over_benchmark?: number | null;
  by_macro_sector?: Record<string, { n: number; median: number; mean: number; p25?: number; p75?: number; p90?: number }>;
}

export interface Pillar5Data {
  meta: { schema_version: string; is_seed: boolean; snapshot_utc: string };
  tor_to_ec_cohorts: {
    universe_counts: {
      total_linked_projects: number;
      strict_clean_fresh_tor_to_ec: number;
      by_target_group: Record<string, number>;
      by_sector: Record<string, number>;
      with_intermediate_tor_amendment: number | Record<string, number>;
      with_multiple_ec_attempts: number | Record<string, number>;
    };
    crunched_cohorts_n?: number;
    summary_by_sector: CohortSummarySlice[];
    featured_cohorts: FeaturedLifecycleCohort[];
  };
  multi_clearance_overlaps: {
    shared_project_id_counts: {
      ec_and_fc?: number;
      ec_and_fc_shared_project_ids?: number;
      ec_and_wlc?: number;
      ec_and_wlc_shared_project_ids?: number;
      ec_and_crz?: number;
      ec_and_crz_shared_project_ids?: number;
      fc_and_wlc?: number;
      fc_and_wlc_shared_project_ids?: number;
    };
    ec_fc_stage1_interlock_stats: {
      proposals_in_interlock_n: number;
      interlock_days: StatsSummary;
      featured_proposal_no: string | null;
    };
  };
  annual_trends_2014_2026: {
    series: AnnualTrendRow[];
    historical_p1_open_benchmarks: {
      source_note: string;
      central_ec_post2014_gross_appraisal_days: HistoricalBenchmarkBlock | null;
      central_ec_post2014_eia_prep_gap_days: HistoricalBenchmarkBlock | null;
      central_tor_historical_scoping_days: HistoricalBenchmarkBlock | null;
      fc_post2014_ua_to_state_recomm_days: HistoricalBenchmarkBlock | null;
    };
  };
}

export interface TraceStep {
  idx: number;
  status: string;
  abbr: string;
  desk_label: string;
  owner: "government" | "applicant" | "interlock" | string;
  bucket: string;
  start_utc: string;
  end_utc: string;
  days: number;
  note?: string | null;
}

export interface ProposalTrace {
  proposal_no: string;
  project_id: string | null;
  caf_number: string | null;
  sw_number: string | null;
  moefcc_file_no: string | null;
  project_name: string;
  proponent_name: string;
  portal: string;
  state: string;
  state_code: string;
  sector_group: string;
  sub_sector: string;
  is_form2_minor_mineral?: boolean;
  category: string | null;
  clearance_track: string;
  clearance_form_label: string | null;
  proposal_purpose: string;
  authority: string;
  status: string;
  cohort_status: string;
  is_terminal: boolean;
  filing_year: number;
  first_submission_utc: string;
  terminal_or_snapshot_utc: string;
  draft_prep_days: number | null;
  wall_days: number;
  gov_days: number;
  applicant_days: number;
  interlock_days: number;
  breakdown_days: BreakdownDays;
  eds_rounds: number;
  ads_rounds: number;
  intragov_query_rounds: number;
  union_minister_desk_days: number | null;
  moefcc_reported_duration_days: number | null;
  clock_reset_erased_gov_days: number | null;
  statutory_benchmark_days: number | null;
  statutory_breach_wall: boolean | null;
  statutory_breach_gov: boolean | null;
  tags: string[];
  source_citation: {
    portal_name: string;
    portal_url: string;
    endpoint: string;
    proposal_no: string;
    certificate_url: string | null;
    accessed_on: string;
  };
  anomalies_clamped?: string[];
  steps: TraceStep[];
}

export interface TracesIndexData {
  meta: {
    schema_version: string;
    is_seed: boolean;
    snapshot_utc: string;
    total_traces: number;
    shard_count: number;
  };
  columns: string[];
  lookups: {
    portals: string[];
    states: string[];
    sectors: string[];
    sub_sectors: string[];
    clearances: string[];
    authorities: string[];
    cohorts: string[];
  };
  featured_proposal_nos: string[];
  rows: Array<
    [
      string, // 0: proposal_no
      string, // 1: project_name_short
      string, // 2: proponent_short
      number, // 3: portal_idx
      number, // 4: state_idx
      number, // 5: sector_idx
      number, // 6: sub_sector_idx
      number, // 7: clearance_idx
      number, // 8: authority_idx
      number, // 9: cohort_idx
      string, // 10: status
      boolean, // 11: is_terminal
      number, // 12: filing_year
      number, // 13: wall_days
      number, // 14: gov_days
      number, // 15: applicant_days
      number, // 16: interlock_days
      number, // 17: eds_rounds
      number, // 18: ads_rounds
      number | null, // 19: moefcc_dur
      string, // 20: shard_file
      string[] // 21: tags
    ]
  >;
}

export interface TracesShardData {
  meta: { schema_version: string; is_seed: boolean; shard_file?: string; count: number };
  proposals: Record<string, ProposalTrace>;
}

export interface AllRedTapeData {
  meta: RedTapeMeta;
  pillar1: Pillar1Data;
  pillar2: Pillar2Data;
  pillar3: Pillar3Data;
  pillar4: Pillar4Data;
  pillar5: Pillar5Data;
  tracesIndex: TracesIndexData;
  featuredTraces: TracesShardData;
}
