import React from "react";
import type {
  AllRedTapeData,
  HeadlineCard,
  ProposalTrace,
} from "./types";
import {
  PLAIN_HEADLINE_LABELS,
  PLAIN_SUB_SECTOR,
  PLAIN_TRACK_TAB,
  fmtDays,
  fmtInt,
  fmtPct,
  isNum,
  plainCohortSliceLabel,
  plainDeskLabel,
} from "./format";
import { SHARED_JS } from "./shared";

interface SharedRT {
  renderTrace(t: ProposalTrace | undefined): string;
  renderItem(r: Record<string, unknown>, active: boolean): string;
  renderBars(rows: Array<Record<string, unknown>>, opts?: Record<string, unknown>): string;
  splitBar(gov: number | null | undefined, app: number | null | undefined, intl?: number | null | undefined): string;
}

const RT = new Function(`${SHARED_JS}; return RT;`)() as SharedRT;

const CANONICAL_BASE = "https://datalibertarian.in";

function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

function SubNav({ active }: { active: "hub" | "methodology" }) {
  return (
    <nav className="dl-subnav" aria-label="Red Tape navigation">
      <div className="dl-subnav-in">
        <a href="/redtape" aria-current={active === "hub" ? "page" : undefined}>
          Overview
        </a>
        <a href="/redtape#trace">Trace an application</a>
        <a href="/redtape#states">By state</a>
        <a href="/redtape/methodology" aria-current={active === "methodology" ? "page" : undefined}>
          Methodology
        </a>
      </div>
    </nav>
  );
}

function PageShell({
  title,
  description,
  canonicalPath,
  active,
  includeClientJs,
  children,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  active: "hub" | "methodology";
  includeClientJs?: boolean;
  children: React.ReactNode;
}) {
  const canonical = `${CANONICAL_BASE}${canonicalPath}`;
  return (
    <html lang="en-IN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Data Libertarian" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${CANONICAL_BASE}/social-preview.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${CANONICAL_BASE}/social-preview.png`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <link rel="stylesheet" href="/redtape/redtape.css" />
        {includeClientJs ? <script src="/redtape/redtape.js" defer /> : null}
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to main content
        </a>
        <SubNav active={active} />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}

function HeroStat({
  id,
  heading,
  card,
  context,
}: {
  id: string;
  heading: string;
  card: HeadlineCard | undefined;
  context: string;
}) {
  const medWall = card?.wall_days.median;
  const medGov = card?.gov_days.median;
  const medApp = card?.applicant_days.median;
  const valNum = fmtDays(medWall, false);
  const unit = isNum(medWall) && medWall >= 1 && Math.round(medWall) === 1 ? "day" : "days";

  return (
    <a
      className="rt-stat"
      href="#compare"
      data-card-id={id}
      data-crunched-n={card?.crunched_n ?? 0}
    >
      <div className="rt-stat-k">{heading}</div>
      <b>
        {valNum} {isNum(medWall) ? <small>{unit}</small> : null}
      </b>
      <p>
        {isNum(medGov) && isNum(medApp)
          ? `${fmtDays(medGov)} with government, ${fmtDays(medApp)} with the company.`
          : context}
      </p>
      {isNum(medGov) && isNum(medApp) ? <div className="rt-stat-n">{context}</div> : null}
    </a>
  );
}

function TrendSvg({
  rows,
}: {
  rows: Array<{
    year: number;
    grantedN: number;
    medWall: number | null;
    medGov: number | null;
    censored: boolean;
  }>;
}) {
  const pts = rows.filter((r) => isNum(r.medWall) && r.grantedN > 0);
  if (pts.length < 2) {
    return (
      <p className="rt-empty">
        Annual trend lines populate once multiple filing years have completed clearances.
      </p>
    );
  }
  const W = 520;
  const H = 240;
  const padL = 44;
  const padR = 24;
  const padT = 22;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const minY = pts[0]!.year;
  const maxY = pts[pts.length - 1]!.year;
  const yearSpan = Math.max(1, maxY - minY);
  const maxVal = Math.max(
    150,
    ...pts.map((p) => Math.max(p.medWall ?? 0, p.medGov ?? 0))
  );
  const niceTop = Math.ceil((maxVal * 1.15) / 50) * 50;

  const xOf = (yr: number) => padL + ((yr - minY) / yearSpan) * plotW;
  const yOf = (d: number) => padT + plotH - Math.min(1, Math.max(0, d / niceTop)) * plotH;

  const wallPath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.year).toFixed(1)},${yOf(p.medWall!).toFixed(1)}`)
    .join(" ");
  const govPts = pts.filter((p) => isNum(p.medGov));
  const govPath = govPts
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.year).toFixed(1)},${yOf(p.medGov!).toFixed(1)}`)
    .join(" ");

  const firstCensored = pts.find((p) => p.censored);
  const yTicks = [0, Math.round(niceTop / 2), niceTop];

  return (
    <svg
      className="rt-trend"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Median waiting days by filing year"
    >
      {firstCensored ? (
        <g>
          <rect
            x={xOf(firstCensored.year) - 8}
            y={padT}
            width={Math.max(16, W - padR - (xOf(firstCensored.year) - 8))}
            height={plotH}
            fill="#F7F7F5"
          />
          <text
            x={W - padR - 4}
            y={padT + 14}
            textAnchor="end"
            fontSize="11"
            fill="#6B7079"
          >
            Recent filings (slower files still pending)
          </text>
        </g>
      ) : null}

      {yTicks.map((t) => {
        const y = yOf(t);
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E6E6E3" strokeWidth="1" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11.5" fill="#6B7079">
              {t}d
            </text>
          </g>
        );
      })}

      <path d={wallPath} fill="none" stroke="#6B7079" strokeWidth="2" strokeDasharray="4 3" />
      {govPts.length >= 2 ? (
        <path d={govPath} fill="none" stroke="#A13A2F" strokeWidth="2.5" />
      ) : null}

      {pts.map((p) => (
        <g key={p.year}>
          <circle cx={xOf(p.year)} cy={yOf(p.medWall!)} r="3.5" fill="#6B7079" />
          {isNum(p.medGov) ? (
            <circle cx={xOf(p.year)} cy={yOf(p.medGov)} r="4" fill="#A13A2F" />
          ) : null}
          <text
            x={xOf(p.year)}
            y={H - 10}
            textAnchor="middle"
            fontSize="11.5"
            fill="#6B7079"
          >
            {String(p.year).slice(-2) === "14" || p.year === minY || p.year === maxY || pts.length <= 7
              ? p.year
              : `’${String(p.year).slice(-2)}`}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RedTapeHubPage({ data }: { data: AllRedTapeData }) {
  const { meta, pillar1, pillar2, pillar3, pillar4, pillar5, tracesIndex, featuredTraces } = data;
  const cardById = new Map<string, HeadlineCard>(pillar1.headline_cards.map((c) => [c.id, c]));

  const cFactories = cardById.get("factories_ec_granted");
  const cMinesMajor = cardById.get("mines_major_ec_granted");
  const cPowerGen = cardById.get("power_gen_ec_granted");
  const cPowerGrid = cardById.get("power_grid_re_fc_wlc_granted");

  // Build Section 1 compare data for GRANTED and PENDING_ACTIVE
  const compareOrder = [
    "factories_ec_granted",
    "mines_major_ec_granted",
    "mines_coal_ec_granted",
    "mines_noncoal_major_ec_granted",
    "mines_form2_minor_ec_granted",
    "power_gen_ec_granted",
    "power_thermal_ec_granted",
    "power_hydro_ec_granted",
    "power_grid_re_fc_wlc_granted",
    "forest_clearance_stage2_granted",
    "wildlife_clearance_disposed",
    "crz_clearance_granted",
    "factories_tor_bespoke_granted",
    "factories_tor_auto_granted",
  ];

  const grantedCompareRows = compareOrder
    .map((id) => {
      const c = cardById.get(id);
      if (!c || c.crunched_n <= 0 || !isNum(c.wall_days.median)) return null;
      const metaLabel = PLAIN_HEADLINE_LABELS[id] || { label: c.label, note: c.subtitle };
      return {
        id,
        label: metaLabel.label,
        note: metaLabel.note,
        n: c.crunched_n,
        median: c.wall_days.median,
        p90: c.wall_days.p90,
        medGov: c.gov_days.median,
        medApp: c.applicant_days.median,
        gov: c.mean_partition_days.gov ?? c.gov_days.median,
        app: c.mean_partition_days.applicant ?? c.applicant_days.median,
        int: c.mean_partition_days.interlock ?? c.interlock_days.median ?? 0,
        limit: c.statutory_breach.benchmark_days,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Map matching PENDING_ACTIVE strata for the "Currently waiting" toggle
  const pendingCompareRows = compareOrder
    .map((id) => {
      const c = cardById.get(id);
      if (!c) return null;
      const match = pillar1.strata.find(
        (s) =>
          s.portal === "ALL" &&
          s.proposal_purpose === "ALL" &&
          s.cohort_status === "PENDING_ACTIVE" &&
          s.sector_group === c.sector_group &&
          s.sub_sector === c.sub_sector &&
          s.clearance_track === c.clearance_track &&
          s.authority === c.authority &&
          s.n > 0 &&
          isNum(s.wall_days.median)
      );
      if (!match) return null;
      const metaLabel = PLAIN_HEADLINE_LABELS[id] || { label: c.label, note: c.subtitle };
      return {
        id,
        label: metaLabel.label,
        note: metaLabel.note,
        n: match.n,
        median: match.wall_days.median,
        p90: match.wall_days.p90,
        medGov: match.gov_days.median,
        medApp: match.applicant_days.median,
        gov: match.mean_partition_days.gov ?? match.gov_days.median,
        app: match.mean_partition_days.applicant ?? match.applicant_days.median,
        int: match.mean_partition_days.interlock ?? match.interlock_days.median ?? 0,
        limit: null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const comparePayload = {
    GRANTED: grantedCompareRows,
    PENDING_ACTIVE: pendingCompareRows,
  };

  const initialCompareHtml = RT.renderBars(
    grantedCompareRows.map((r) => ({
      id: r.id,
      label: r.label,
      note: r.note,
      total: r.median,
      gov: r.gov,
      app: r.app,
      int: r.int,
      mark: r.limit,
      markLabel: r.limit ? `${r.limit}-day legal limit` : "",
    }))
  );

  // Initial featured trace & explorer list
  const featuredMap = featuredTraces.proposals || {};
  const featuredNos = tracesIndex.featured_proposal_nos || [];
  const candidateOrder = [...featuredNos, ...Object.keys(featuredMap)];
  let initialTrace: ProposalTrace | undefined;
  for (const pno of candidateOrder) {
    const t = featuredMap[pno];
    if (t && t.steps && t.steps.length >= 4 && isNum(t.moefcc_reported_duration_days)) {
      initialTrace = t;
      break;
    }
  }
  if (!initialTrace) {
    for (const pno of candidateOrder) {
      if (featuredMap[pno]) {
        initialTrace = featuredMap[pno];
        break;
      }
    }
  }

  const lk = tracesIndex.lookups;
  const decodedRows = (tracesIndex.rows || []).map((raw) => ({
    proposal_no: raw[0],
    project_name: raw[1],
    proponent: raw[2],
    state: lk.states[raw[4]] || "",
    sector: lk.sectors[raw[5]] || "",
    sub_sector: lk.sub_sectors[raw[6]] || "",
    clearance: lk.clearances[raw[7]] || "",
    authority: lk.authorities[raw[8]] || "",
    cohort: lk.cohorts[raw[9]] || "",
    status: raw[10],
    wall_days: raw[13],
    gov_days: raw[14],
    applicant_days: raw[15],
    interlock_days: raw[16],
  }));
  decodedRows.sort((a, b) => {
    const fa = featuredNos.indexOf(a.proposal_no);
    const fb = featuredNos.indexOf(b.proposal_no);
    const ia = fa === -1 ? 1e9 : fa;
    const ib = fb === -1 ? 1e9 : fb;
    return ia - ib || (b.wall_days || 0) - (a.wall_days || 0);
  });
  const initialListHtml = decodedRows
    .slice(0, 12)
    .map((r) => RT.renderItem(r, r.proposal_no === initialTrace?.proposal_no))
    .join("");
  const sortedStateNames = [...(lk.states || [])].sort((a, b) => a.localeCompare(b));

  // Hero try-links from real featured proposals
  const tryHints = candidateOrder
    .map((pno) => featuredMap[pno])
    .filter((t): t is ProposalTrace => Boolean(t))
    .slice(0, 3);

  // Section 3A: Query rounds bar chart data
  function mapRoundBuckets(kind: "eds" | "ads") {
    const list = kind === "ads" ? pillar2.ads_rounds_by_stratum : pillar2.eds_rounds_by_stratum;
    const match =
      list.find(
        (r) =>
          r.sector_group === "All_Target_Sectors" &&
          r.clearance_track === "ALL" &&
          r.authority === "All Authorities" &&
          r.cohort_status === "GRANTED"
      ) ||
      list.find((r) => r.sector_group === "All_Target_Sectors" && r.cohort_status === "GRANTED") ||
      list[0];
    if (!match) return [];
    const roundTitle: Record<string, string> = {
      "0": "No questions asked",
      "1": "1 round of questions",
      "2": "2 rounds of questions",
      "3+": "3 or more rounds",
    };
    return (match.buckets || [])
      .filter((b) => b.count > 0 && isNum(b.median_wall_days))
      .map((b) => ({
        label: roundTitle[b.rounds_label] || `${b.rounds_label} rounds`,
        note: `${fmtInt(b.count)} granted filings (${fmtPct(b.pct)})`,
        total: b.median_wall_days,
        gov: b.mean_gov_days ?? b.median_gov_days ?? 0,
        app: b.mean_applicant_days ?? b.median_applicant_days ?? 0,
        int: 0,
      }));
  }

  const roundsPayload = {
    eds: mapRoundBuckets("eds"),
    ads: mapRoundBuckets("ads"),
  };
  const initialRoundsHtml = RT.renderBars(roundsPayload.eds);
  const fcLoopRow = pillar2.intragov_pingpong.summary_by_clearance.find(
    (r) => r.clearance_track === "FC" && r.proposals_n > 0
  );
  const fcLoopStats = fcLoopRow?.intragov_days_when_present ?? fcLoopRow?.intragov_days;

  // Section 3B: Official clock vs actual government time dumbbell rows (stratum medians + top traced examples)
  const plainClockCohortLabel = (row: { sector_group: string; authority: string; label: string }) => {
    if (row.sector_group === "ALL" && /central/i.test(row.authority)) return "Union ministry (MoEFCC)";
    if (row.sector_group === "ALL" && /state/i.test(row.authority)) return "State authorities (SEIAA)";
    if (row.sector_group === "Factories") return "Factories";
    if (row.sector_group === "Mines") return "Major mines";
    if (row.sector_group === "Power") return "Thermal & hydro power";
    return row.label.replace(/\s*\([^)]*\)/g, "").trim();
  };
  const dumbbellCohorts = (pillar3.by_sector_and_authority || [])
    .filter(
      (r) =>
        !(r.sector_group === "ALL" && r.authority === "All Authorities") &&
        r.audited_with_duration_n > 0 &&
        isNum(r.median_official_days) &&
        isNum(r.median_true_gov_days)
    )
    .sort(
      (a, b) =>
        (b.median_true_gov_days! - b.median_official_days!) -
        (a.median_true_gov_days! - a.median_official_days!)
    );
  const dbMax = Math.max(
    140,
    ...dumbbellCohorts.map((r) => Math.max(r.median_true_gov_days ?? 0, r.median_official_days ?? 0))
  ) * 1.08;
  const topClockExamples = (pillar3.verified_examples || [])
    .filter((e) => isNum(e.moefcc_proposal_duration) && isNum(e.erased_gov_days) && e.erased_gov_days >= 20)
    .sort((a, b) => (b.erased_gov_days ?? 0) - (a.erased_gov_days ?? 0))
    .slice(0, 2);

  // Section 3C: Internal desks waterfall
  const deskEntries = Object.entries(pillar4.desk_waterfalls || {}).filter(
    ([, t]) => t.proposals_n > 0
  );

  // Section 4: 36-state leaderboard
  const sortedStates = [...(pillar4.state_leaderboard || [])].sort((a, b) => {
    const ecA = (a.granted_ec_substantive ?? a.granted_ec_all)?.median_gov_days;
    const ecB = (b.granted_ec_substantive ?? b.granted_ec_all)?.median_gov_days;
    if (isNum(ecA) && isNum(ecB)) return ecB - ecA;
    if (isNum(ecA)) return -1;
    if (isNum(ecB)) return 1;
    return b.p2_clean_volume_total - a.p2_clean_volume_total;
  });

  // Section 5: Multi-stage journey & annual trend
  const journeySlices = pillar5.tor_to_ec_cohorts.summary_by_sector.filter(
    (s) =>
      s.n > 0 &&
      ["All_Clean_Cohorts", "Factories", "Mines_Major", "Power_All", "Central (MoEFCC)", "State (SEIAA)"].includes(
        s.slice_id
      ) &&
      isNum(s.phases.end_to_end_tor_sub_to_ec_grant_days.median)
  );
  const journeyMax = Math.max(
    400,
    ...journeySlices.map((s) => s.phases.end_to_end_tor_sub_to_ec_grant_days.median ?? 0)
  ) * 1.06;

  const rawTrend = pillar5.annual_trends_2014_2026.series.filter(
    (r) => r.sector_group === "All_Target_Sectors" && r.clearance_track === "EC"
  );
  const trendSource =
    rawTrend.length > 0
      ? rawTrend
      : pillar5.annual_trends_2014_2026.series.filter((r) => r.sector_group === "All_Target_Sectors");
  const trendChartRows = trendSource.map((r) => ({
    year: r.year,
    grantedN: r.crunched_granted_n,
    medWall: r.completed_wall_days.median,
    medGov:
      r.completed_gov_days.n > 0 && r.completed_gov_days.n === r.completed_wall_days.n
        ? r.completed_gov_days.median
        : null,
    censored: r.is_right_censored_filing_year,
  }));
  const validTrendYears = trendChartRows.filter((r) => isNum(r.medWall) && r.grantedN > 0).map((r) => r.year);
  const trendYearRange =
    validTrendYears.length >= 2
      ? `${validTrendYears[0]}–${validTrendYears[validTrendYears.length - 1]}`
      : "2014–2024";

  const description = `How long factories, mines and power projects wait for environmental, forest and wildlife permission on PARIVESH across ${fmtInt(
    meta.coverage.p2_directory_clean_total
  )} filings — separating government desk time from company reply time.`;

  return (
    <PageShell
      title="How long it takes to get permission to build in India — Data Libertarian"
      description={description}
      canonicalPath="/redtape"
      active="hub"
      includeClientJs
    >
      {/* ==================== HERO ==================== */}
      <section className="rt-hero" aria-labelledby="hero-title">
        <div className="rt-wrap">
          <h1 id="hero-title">How long it takes to get permission to build in India.</h1>
          <p className="rt-hero-sub">
            Before a factory breaks ground, a mine opens a seam, or a power line crosses forest land, it needs clearance
            on the environment ministry’s PARIVESH portal. Across{" "}
            <span className="rt-num">{fmtInt(meta.coverage.p2_directory_clean_total)}</span> filings, we trace each
            application from desk to desk to separate the days it sits with government officials from the days companies
            spend answering questions.
          </p>

          <form className="rt-search" id="rt-hero-form" role="search" action="#trace">
            <label className="rt-sr" htmlFor="rt-hero-q">
              Look up an application
            </label>
            <input
              id="rt-hero-q"
              type="search"
              placeholder="Look up a factory, mine, power project, proposal ID, or state…"
              autoComplete="off"
            />
            <button type="submit">Trace</button>
          </form>

          {tryHints.length > 0 ? (
            <p className="rt-hint">
              Try{" "}
              {tryHints.map((t, i) => (
                <React.Fragment key={t.proposal_no}>
                  {i > 0 ? (i === tryHints.length - 1 ? " or " : ", ") : null}
                  <a href={`?proposal=${encodeURIComponent(t.proposal_no)}#trace`} data-open-proposal={t.proposal_no}>
                    {PLAIN_SUB_SECTOR[t.sub_sector]?.toLowerCase() || "a project"} in {t.state}
                  </a>
                </React.Fragment>
              ))}
              .
            </p>
          ) : null}

          <div className="rt-stats" aria-label="Typical clearance waits by sector">
            <HeroStat
              id="factories_ec_granted"
              heading="Factories"
              card={cFactories}
              context="Typical wait for environmental clearance"
            />
            <HeroStat
              id="mines_major_ec_granted"
              heading="Major mines"
              card={cMinesMajor}
              context="Coal & large mineral mines (excl. small quarries)"
            />
            <HeroStat
              id="power_gen_ec_granted"
              heading="Thermal & hydro power"
              card={cPowerGen}
              context="Power stations & river-valley projects"
            />
            <HeroStat
              id="power_grid_re_fc_wlc_granted"
              heading="Solar, wind & power grid"
              card={cPowerGrid}
              context="Forest & wildlife permissions (exempt from EC)"
            />
          </div>
        </div>
      </section>

      {/* ==================== SECTION 1: COMPARE SECTORS ==================== */}
      <section className="rt-sec" id="compare" aria-labelledby="h-compare">
        <div className="rt-wrap">
          <h2 id="h-compare">Factories, mines and power projects compared</h2>
          <p className="rt-lead">
            Every day after a company submits its application belongs either to a government desk, to the company
            answering questions, or to a statutory wait for Stage-I forest approval. Small sand and stone quarries under
            5 hectares are separated from major industrial mines so quarry volume never hides how long real mines wait.
          </p>

          <script
            type="application/json"
            id="rt-compare-json"
            dangerouslySetInnerHTML={{ __html: safeJson(comparePayload) }}
          />

          <div className="rt-toolbar">
            <div className="rt-legend" aria-label="Colour key">
              <span>
                <i className="rt-dot rt-dot-gov" />
                With government
              </span>
              <span>
                <i className="rt-dot rt-dot-app" />
                With the company
              </span>
              <span>
                <i className="rt-dot rt-dot-int" />
                Waiting for forest clearance
              </span>
            </div>

            <div className="rt-controls-row">
              <div className="rt-seg-group" role="group" aria-label="Statistic">
                <button type="button" data-cmp-metric="median" aria-pressed="true">
                  Median wait
                </button>
                <button type="button" data-cmp-metric="p90" aria-pressed="false">
                  Slowest 10%
                </button>
              </div>
              <div className="rt-seg-group" role="group" aria-label="Application status">
                <button type="button" data-cmp-cohort="GRANTED" aria-pressed="true">
                  Granted
                </button>
                <button type="button" data-cmp-cohort="PENDING_ACTIVE" aria-pressed="false">
                  Currently waiting
                </button>
              </div>
            </div>
          </div>

          <div
            id="rt-compare-chart"
            dangerouslySetInnerHTML={{ __html: initialCompareHtml }}
          />
          <p className="rt-caption" id="rt-compare-caption">
            Bar length is the typical (median) wait. Colours show the average share of that time each side held the
            file; dashed lines mark the statutory limit (60 days for scoping, 105 days for environmental clearance).
          </p>

          <details className="rt-more-table">
            <summary>See exact figures for all project types</summary>
            <table className="rt-table" id="rt-headline-table">
              <thead>
                <tr>
                  <th>Project &amp; permission type</th>
                  <th>Traced</th>
                  <th>Median wait</th>
                  <th>With government</th>
                  <th>Slowest 10%</th>
                </tr>
              </thead>
              <tbody>
                {grantedCompareRows.map((r) => (
                  <tr key={r.id} data-headline-row={r.id}>
                    <td>
                      {r.label}
                      <small>{r.note}</small>
                    </td>
                    <td>{fmtInt(r.n)}</td>
                    <td>{fmtDays(r.median)}</td>
                    <td>{fmtDays(r.medGov)}</td>
                    <td>{fmtDays(r.p90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </section>

      {/* ==================== SECTION 2: TRACE ANY APPLICATION (SINGLE TINT BAND) ==================== */}
      <section className="rt-sec rt-sec-tint" id="trace" aria-labelledby="h-trace">
        <div className="rt-wrap">
          <h2 id="h-trace">Trace an application from desk to desk</h2>
          <p className="rt-lead">
            Pick any real PARIVESH filing below to follow every hand-off between government officials (left) and the
            company (right), with exact dates and days held at each step.
          </p>

          <div className="rt-finder">
            <div className="rt-finder-top">
              <label className="rt-sr" htmlFor="rt-q">
                Search applications
              </label>
              <input
                id="rt-q"
                type="search"
                placeholder="Search project name, company, proposal ID, or state…"
                autoComplete="off"
              />
              <label className="rt-sr" htmlFor="rt-state">
                Filter by state
              </label>
              <select id="rt-state" defaultValue="">
                <option value="">All states &amp; UTs</option>
                {sortedStateNames.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <div className="rt-seg-group" role="group" aria-label="Sector">
                <button type="button" data-sector="" aria-pressed="true">
                  All
                </button>
                <button type="button" data-sector="Factories" aria-pressed="false">
                  Factories
                </button>
                <button type="button" data-sector="Mines" aria-pressed="false">
                  Mines
                </button>
                <button type="button" data-sector="Power" aria-pressed="false">
                  Power
                </button>
              </div>
            </div>

            <div className="rt-stories" role="group" aria-label="Notable patterns">
              <span>Stories:</span>
              <button type="button" className="rt-chip" data-preset="rounds3" aria-pressed="false">
                3+ rounds of back-and-forth
              </button>
              <button type="button" className="rt-chip" data-preset="clock" aria-pressed="false">
                Official clock reset gap
              </button>
              <button type="button" className="rt-chip" data-preset="forest_loop" aria-pressed="false">
                Forest inter-department loop
              </button>
              <button type="button" className="rt-chip" data-preset="minister" aria-pressed="false">
                Reached the Union Minister
              </button>
              <button type="button" className="rt-linkbtn" id="rt-reset">
                Clear filters
              </button>
            </div>
          </div>

          <div className="rt-trace-grid">
            <div className="rt-list-col">
              <div className="rt-list-head">
                <span id="rt-count">{fmtInt(tracesIndex.meta.total_traces)} applications</span>
                <span>Total wait</span>
              </div>
              <ul
                className="rt-list"
                id="rt-list"
                dangerouslySetInnerHTML={{ __html: initialListHtml }}
              />
              {decodedRows.length > 12 ? (
                <div className="rt-more">
                  <button type="button" className="rt-chip" id="rt-more">
                    Show more applications
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className="rt-detail"
              id="rt-trace-detail"
              data-initial-proposal={initialTrace?.proposal_no || ""}
              aria-live="polite"
              dangerouslySetInnerHTML={{ __html: RT.renderTrace(initialTrace) }}
            />
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: WHY PROJECTS WAIT ==================== */}
      <section className="rt-sec" id="why" aria-labelledby="h-why">
        <div className="rt-wrap">
          <h2 id="h-why">Why applications take months — or years</h2>
          <p className="rt-lead">
            Delays rarely come from a single desk sitting idle. Three mechanics drive most long waits: repeated rounds
            of deficiency questions, an official clock that restarts mid-stream, and multi-tier committee routing.
          </p>

          {/* 3A: Back-and-forth rounds */}
          <div className="rt-sub" style={{ marginTop: 12, paddingTop: 28 }}>
            <div className="rt-toolbar">
              <div>
                <h3>1. Every round of questions adds wait time on both sides</h3>
                <p style={{ margin: "4px 0 0", color: "var(--rt-ink-2)", maxWidth: "60ch" }}>
                  When officials send back a question, the company takes weeks to gather reports — and the file then
                  queues again for fresh government scrutiny.
                </p>
              </div>
              <div className="rt-seg-group" role="group" aria-label="Question stage">
                <button type="button" data-rounds="eds" aria-pressed="true">
                  Scrutiny questions
                </button>
                <button type="button" data-rounds="ads" aria-pressed="false">
                  Committee questions
                </button>
              </div>
            </div>

            <script
              type="application/json"
              id="rt-rounds-json"
              dangerouslySetInnerHTML={{ __html: safeJson(roundsPayload) }}
            />
            <div
              id="rt-rounds-chart"
              dangerouslySetInnerHTML={{ __html: initialRoundsHtml }}
            />

            <p style={{ margin: "28px 0 8px", fontSize: 15, color: "var(--rt-ink-2)", maxWidth: "66ch" }}>
              <b>Inside forest clearances, government offices also query one another.</b>{" "}
              {fcLoopRow
                ? `In ${fmtPct(fcLoopRow.pct_with_intragov_loops)} of traced forest filings${
                    isNum(fcLoopStats?.median) ? ` (adding a typical ${fmtDays(fcLoopStats.median)})` : ""
                  }, files bounce back and forth across five tiers of forest officials while the company cannot act:`
                : "Files routinely bounce across five tiers of state and central forest officials while the company cannot act:"}
            </p>
            <div className="rt-chain" aria-label="Forest clearance internal query loop">
              <span>District forest officer</span>
              <i>↔</i>
              <span>Conservator of forests</span>
              <i>↔</i>
              <span>State nodal officer</span>
              <i>↔</i>
              <span>State government</span>
              <i>↔</i>
              <span>Union regional office</span>
            </div>
          </div>

          {/* 3B: Official clock vs actual government time */}
          <div className="rt-sub" id="clock-audit">
            <h3>2. The ministry’s published counter restarts after early questions</h3>
            <p>
              PARIVESH carries an internal day counter (<code className="rt-code">proposal_duration</code>) on granted
              clearances. After verifying its post-acceptance reset rule directly against{" "}
              <span className="rt-num">{fmtInt(pillar3.audit_summary.direct_caf_endpoint_verified_n ?? 15)}</span>{" "}
              granted Common Application Form payloads and evaluating all{" "}
              <span className="rt-num">{fmtInt(pillar3.audit_summary.granted_with_official_duration_n)}</span> mature
              granted clearances from their timestamped step logs,{" "}
              <b>{fmtPct(pillar3.audit_summary.understated_gt_1d_pct)}</b> understate true government desk time because
              days spent on initial scrutiny before a question is raised are wiped out when the clock restarts at formal
              acceptance.
            </p>

            {dumbbellCohorts.length > 0 ? (
              <>
                <div className="rt-legend" style={{ marginBottom: 14 }}>
                  <span>
                    <i
                      className="rt-dot"
                      style={{ background: "#fff", border: "2px solid #4A4F59" }}
                    />
                    Ministry’s published median
                  </span>
                  <span>
                    <i className="rt-dot rt-dot-gov" />
                    Actual median days on government desks
                  </span>
                </div>
                <div className="rt-db">
                  {dumbbellCohorts.map((row) => {
                    const off = Math.max(0, row.median_official_days ?? 0);
                    const tru = Math.max(off, row.median_true_gov_days ?? 0);
                    const xOff = (off / dbMax) * 100;
                    const xTru = (tru / dbMax) * 100;
                    const label = plainClockCohortLabel(row);
                    return (
                      <div className="rt-db-row" key={`${row.sector_group}-${row.authority}`}>
                        <div className="rt-bar-label">
                          <b>{label}</b>
                          <span>
                            {fmtInt(row.audited_with_duration_n)} grants · {fmtPct(row.understated_gt_1d_pct)} understated
                          </span>
                        </div>
                        <div className="rt-db-canvas">
                          <span
                            className="rt-db-line"
                            style={{ left: `${xOff.toFixed(2)}%`, width: `${Math.max(0.5, xTru - xOff).toFixed(2)}%` }}
                          />
                          <span className="rt-db-dot rt-db-off" style={{ left: `${xOff.toFixed(2)}%` }} />
                          <span className="rt-db-dot rt-db-true" style={{ left: `${xTru.toFixed(2)}%` }} />
                          <span className="rt-db-val" style={{ left: `${xTru.toFixed(2)}%` }}>
                            <b>{fmtDays(tru)}</b> <span>(published: {fmtDays(off)})</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {topClockExamples.length > 0 ? (
                  <p className="rt-caption" style={{ marginTop: 18 }}>
                    Individual filings can lose months when early scrutiny is wiped out:{" "}
                    {topClockExamples.map((ex, idx) => (
                      <React.Fragment key={ex.proposal_no}>
                        {idx > 0 ? "; " : null}
                        <a href={`?proposal=${encodeURIComponent(ex.proposal_no)}#trace`} data-open-proposal={ex.proposal_no}>
                          {(PLAIN_SUB_SECTOR[ex.sub_sector] || ex.sector_group).toLowerCase()} in {ex.state}
                        </a>{" "}
                        published {fmtDays(ex.moefcc_proposal_duration)} after <b>{fmtDays(ex.true_gov_days)}</b> on
                        government desks
                      </React.Fragment>
                    ))}
                    .
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          {/* 3C: Inside the desks */}
          <div className="rt-sub">
            <div className="rt-toolbar">
              <div>
                <h3>3. Where files spend the longest inside government</h3>
                <p style={{ margin: "4px 0 0", color: "var(--rt-ink-2)", maxWidth: "60ch" }}>
                  Typical (median) days a file sits at each desk when that stage is reached. Expert committees, state
                  authorities, and district forest inspections dominate total government time.
                </p>
              </div>
              <div className="rt-seg-group" role="group" aria-label="Clearance track">
                {deskEntries.map(([key, track], idx) => (
                  <button
                    key={key}
                    type="button"
                    data-desk-track={key}
                    aria-pressed={idx === 0 ? "true" : "false"}
                  >
                    {PLAIN_TRACK_TAB[key] || track.track_label}
                  </button>
                ))}
              </div>
            </div>

            {deskEntries.map(([key, track], idx) => {
              const deskBarRows = track.desks
                .filter((d) => d.proposals_touching_n > 0 && isNum(d.dwell_days_when_touched.median))
                .map((d) => ({
                  label: plainDeskLabel(d.desk_label, d.desk_id),
                  note: `Reached by ${fmtPct(d.touch_rate_pct)} of filings${
                    isNum(d.share_of_track_gov_time_pct)
                      ? ` · ${fmtPct(d.share_of_track_gov_time_pct)} of government time`
                      : ""
                  }`,
                  total: d.dwell_days_when_touched.median,
                  gov: d.owner === "government" ? d.dwell_days_when_touched.median : 0,
                  app: d.owner === "applicant" ? d.dwell_days_when_touched.median : 0,
                  int: d.owner === "interlock" ? d.dwell_days_when_touched.median : 0,
                }));
              return (
                <div
                  key={key}
                  data-desk-panel={key}
                  hidden={idx !== 0}
                  dangerouslySetInnerHTML={{
                    __html: RT.renderBars(deskBarRows, { split: false }),
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 4: BY STATE ==================== */}
      <section className="rt-sec" id="states" aria-labelledby="h-states">
        <div className="rt-wrap">
          <div className="rt-toolbar" style={{ alignItems: "flex-end" }}>
            <div>
              <h2 id="h-states">Across India’s 36 states and union territories</h2>
              <p className="rt-lead" style={{ marginBottom: 0 }}>
                Total PARIVESH 2.0 filings and typical waiting times for substantive environmental clearances (excluding
                small quarries under 5 hectares). Click any column heading to sort.
              </p>
            </div>
            <div>
              <label className="rt-sr" htmlFor="rt-state-q">
                Find a state or union territory
              </label>
              <input
                id="rt-state-q"
                type="search"
                placeholder="Find a state or UT…"
                autoComplete="off"
                style={{
                  height: 42,
                  padding: "0 12px",
                  border: "1px solid var(--rt-line-2)",
                  borderRadius: 8,
                  font: "inherit",
                  fontSize: 15,
                  minWidth: 220,
                }}
              />
            </div>
          </div>

          <p className="rt-caption" id="rt-state-count" style={{ marginTop: 0, marginBottom: 10 }}>
            Showing {sortedStates.length} of {sortedStates.length} states and union territories
          </p>

          <table className="rt-table" id="rt-state-table">
            <thead>
              <tr>
                <th data-sort="text">
                  <button type="button">State / UT</button>
                </th>
                <th data-sort="num">
                  <button type="button">Filings</button>
                </th>
                <th className="rt-l rt-hide-sm">Clock split</th>
                <th data-sort="num" aria-sort="descending">
                  <button type="button">With government</button>
                </th>
                <th data-sort="num">
                  <button type="button">With company</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStates.map((s) => {
                const ec = s.granted_ec_substantive ?? s.granted_ec_all;
                const medGov = ec?.median_gov_days;
                const medApp = ec?.median_applicant_days;
                const hasData = isNum(medGov);
                return (
                  <tr key={s.state_code} data-state={s.state_name} data-ut={s.is_ut ? "1" : "0"}>
                    <td data-val={s.state_name}>{s.state_name}</td>
                    <td data-val={s.p2_clean_volume_total}>{fmtInt(s.p2_clean_volume_total)}</td>
                    <td
                      className="rt-l rt-hide-sm"
                      style={{ width: 180 }}
                      dangerouslySetInnerHTML={{
                        __html: hasData
                          ? RT.splitBar(medGov, medApp, 0)
                          : '<span class="rt-muted">—</span>',
                      }}
                    />
                    <td data-val={isNum(medGov) ? medGov : ""}>{fmtDays(medGov)}</td>
                    <td data-val={isNum(medApp) ? medApp : ""}>{fmtDays(medApp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== SECTION 5: FULL PROJECT JOURNEY & 2014–2026 TREND ==================== */}
      <section className="rt-sec" id="journey" aria-labelledby="h-journey">
        <div className="rt-wrap">
          <div className="rt-two">
            <div>
              <h2 id="h-journey">From first scoping to final clearance</h2>
              <p className="rt-lead">
                Large factories, mines, and power plants apply twice: first for scoping terms of reference, then — after
                months of environmental studies and local public hearings — for final clearance. Across{" "}
                <span className="rt-num">
                  {fmtInt(pillar5.tor_to_ec_cohorts.universe_counts.total_linked_projects)}
                </span>{" "}
                linked projects, the full journey spans well over a year.
              </p>

              <div className="rt-journey-legend">
                <span>
                  <i className="rt-sw rt-ph-tor" />
                  Scoping (gov)
                </span>
                <span>
                  <i className="rt-sw rt-ph-eia" />
                  Study &amp; public hearing
                </span>
                <span>
                  <i className="rt-sw rt-ph-ec" />
                  Final clearance (gov)
                </span>
                <span>
                  <i className="rt-sw rt-ph-app" />
                  Company replies
                </span>
              </div>

              <div className="rt-bars">
                {journeySlices.map((s) => {
                  const p = s.phases;
                  const torGov = Math.max(0, p.initial_tor_gov_days.mean ?? p.initial_tor_gov_days.median ?? 0);
                  const eia = Math.max(0, p.pure_eia_ph_prep_gap_days.mean ?? p.pure_eia_ph_prep_gap_days.median ?? 0);
                  const ecGov = Math.max(0, p.final_ec_gov_days.mean ?? p.final_ec_gov_days.median ?? 0);
                  const appReply =
                    Math.max(0, p.initial_tor_applicant_days.mean ?? p.initial_tor_applicant_days.median ?? 0) +
                    Math.max(0, p.final_ec_applicant_days.mean ?? p.final_ec_applicant_days.median ?? 0);
                  const sumParts = Math.max(1, torGov + eia + ecGov + appReply);
                  const totalMed = p.end_to_end_tor_sub_to_ec_grant_days.median ?? sumParts;
                  const eiaMed = p.pure_eia_ph_prep_gap_days.median ?? eia;
                  const wPct = Math.min(100, (totalMed / journeyMax) * 100);
                  return (
                    <div
                      className="rt-bar-row"
                      key={s.slice_id}
                      style={{ gridTemplateColumns: "150px minmax(0, 1fr)", gap: 16 }}
                    >
                      <div className="rt-bar-label">
                        <b>{plainCohortSliceLabel(s.slice_id, s.label)}</b>
                        <span>{fmtInt(s.n)} projects</span>
                      </div>
                      <div className="rt-bar-track">
                        <div className="rt-bar-canvas">
                          <div className="rt-bar" style={{ width: `${wPct.toFixed(2)}%` }}>
                            <span
                              className="rt-seg rt-ph-tor"
                              style={{ width: `${((torGov / sumParts) * 100).toFixed(2)}%` }}
                            />
                            <span
                              className="rt-seg rt-ph-eia"
                              style={{ width: `${((eia / sumParts) * 100).toFixed(2)}%` }}
                            />
                            <span
                              className="rt-seg rt-ph-ec"
                              style={{ width: `${((ecGov / sumParts) * 100).toFixed(2)}%` }}
                            />
                            <span
                              className="rt-seg rt-ph-app"
                              style={{ width: `${((appReply / sumParts) * 100).toFixed(2)}%` }}
                            />
                          </div>
                          <span className="rt-bar-val rt-num" style={{ left: `${wPct.toFixed(2)}%` }}>
                            {fmtDays(totalMed)}
                          </span>
                        </div>
                        <span className="rt-bar-split">
                          {fmtDays(p.cohort_total_gov_days.median)} on government desks · {fmtDays(eiaMed)} environmental
                          study &amp; hearing
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2>Waiting times by filing year ({trendYearRange})</h2>
              <p className="rt-lead">
                Completed full-stage environmental clearances across PARIVESH 1.0 and 2.0. Filings from 2025–2026 are
                omitted because slower applications from those cohorts are still in the queue.
              </p>
              <div className="rt-legend" style={{ marginBottom: 12 }}>
                <span>
                  <i className="rt-dot rt-dot-gov" />
                  Median days with government
                </span>
                <span>
                  <i className="rt-dot" style={{ background: "#6B7079" }} />
                  Median total wait
                </span>
              </div>
              <TrendSvg rows={trendChartRows} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== QUIET OPEN DATA & METHODOLOGY BAND ==================== */}
      <aside className="rt-data" id="downloads" aria-label="Open data and methodology">
        <div className="rt-wrap">
          <p>
            <b>Open data:</b>{" "}
            <a href="/redtape/data/parivesh-sector-state-summary.csv" download>
              Sector &amp; state summary (CSV)
            </a>{" "}
            ·{" "}
            <a href="/redtape/data/parivesh-sample-traces.csv" download>
              Traced applications (CSV)
            </a>{" "}
            · <a href="/redtape/data/pillar1_durations.json">Full statistical tables (JSON)</a>
          </p>
          <p>
            Reconstructed across <span className="rt-num">{fmtInt(meta.coverage.total_timelines_crunched_n)}</span>{" "}
            clearance timelines from <span className="rt-num">{fmtInt(meta.coverage.p2_directory_clean_total)}</span>{" "}
            public PARIVESH filings. <a href="/redtape/methodology">Read the methodology and source endpoints →</a>
          </p>
        </div>
      </aside>
    </PageShell>
  );
}

export function RedTapeMethodologyPage({ data }: { data: AllRedTapeData }) {
  const { meta, pillar3 } = data;
  return (
    <PageShell
      title="Methodology — How we measure waiting time on PARIVESH — Data Libertarian"
      description="How Data Libertarian reconstructs desk-by-desk clearance timelines across PARIVESH 1.0 and PARIVESH 2.0 for factories, mines, and power projects."
      canonicalPath="/redtape/methodology"
      active="methodology"
    >
      <section className="rt-hero">
        <div className="rt-wrap">
          <h1>How we measure waiting time on PARIVESH.</h1>
          <p className="rt-hero-sub">
            Published clearance averages rarely state when the clock starts, whether it restarts after questions, or who
            held the file on each day. Here is how every number on <a href="/redtape">/redtape</a> is built and checked.
          </p>
        </div>
      </section>

      <section className="rt-sec">
        <div className="rt-wrap">
          <div className="rt-prose">
            <h2>1. Official sources</h2>
            <p>
              All records come from public, unauthenticated pages and JSON endpoints of the Ministry of Environment,
              Forest and Climate Change’s single-window clearance portals:
            </p>
            <ul>
              {meta.sources.map((s) => (
                <li key={s.id}>
                  <b>{s.name}</b> (<a href={s.url}>{s.url}</a>) — {s.scope} (accessed {s.accessed_on}).
                </li>
              ))}
            </ul>

            <h2>2. Cleaning test and sandbox filings</h2>
            <p>
              From <b className="rt-num">{fmtInt(meta.coverage.p2_directory_raw_total)}</b> raw PARIVESH 2.0 listing
              rows, we remove <b className="rt-num">{fmtInt(meta.coverage.p2_hygiene_filtered_total)}</b> non-real test
              entries (<span className="rt-num">{fmtInt(meta.coverage.p2_hygiene_dummy_state_rows)}</span> filed under
              the ministry’s internal <code>Dummy State</code> sandbox and{" "}
              <span className="rt-num">{fmtInt(meta.coverage.p2_hygiene_test_keyword_rows)}</span> internal developer
              test entries), leaving <b className="rt-num">{fmtInt(meta.coverage.p2_directory_clean_total)}</b> real
              applications across all 36 states and union territories.
            </p>

            <h2>3. Splitting the clock between government and the company</h2>
            <p>
              Time spent drafting a form before first submission is kept apart and excluded from waiting times. From the
              moment an application is submitted until a final decision — or until our snapshot timestamp (
              <code>{meta.snapshot_utc}</code>) for applications still pending — each workflow step is assigned to one
              of three owners:
            </p>
            <ul>
              <li>
                <b>With government:</b> Initial and post-reply scrutiny, scheduling and appraisal by expert committees
                (EAC, SEAC, FAC, NBWL), file routing across ministry or state officers up to the Minister, and
                department-to-department queries between forest or wildlife officials.
              </li>
              <li>
                <b>With the company:</b> Days spent answering Essential Details Sought (EDS) during scrutiny, answering
                Additional Details Sought (ADS) after committee review, meeting Stage-I forest conditions and paying
                compensatory levies before final forest diversion, or sitting unanswered before 90-day delisting.
              </li>
              <li>
                <b>Waiting for forest clearance:</b> Days where an environmental clearance has already been recommended
                by the expert committee, but formal grant is legally held until Stage-I forest clearance arrives on
                overlapping forest land.
              </li>
            </ul>
            <p>
              Every full-stage timeline obeys the exact accounting identity <code>{meta.partition_equation}</code>. On
              older PARIVESH 1.0 records that record only submission and grant dates without a query log (such as state
              SEIAA summaries and historical scoping tables), we report total wall-clock time only and leave the
              government/company split blank (<code>—</code>) rather than assuming zero company time.
            </p>
            <p>
              To avoid right-censoring bias — where recent cohorts look artificially fast because only quick approvals
              have finished while complex applications remain pending — headline completed-wait medians on PARIVESH 2.0
              are restricted to applications filed through mid-2024, annual trend lines omit 2025–2026, and any
              sub-group or state cell with fewer than 30 traced timelines is suppressed (<code>—</code>).
            </p>

            <h2>4. Why major mines are separated from small quarries, and how power is tracked</h2>
            <ul>
              <li>
                <b>Mines vs. small quarries:</b> More than half of all mining applications on PARIVESH 2.0 (
                <span className="rt-num">
                  {fmtInt(meta.directory_volumes_p2_clean.by_target_sector.Mines.noncoal_form2_minor_ec_tor)}
                </span>{" "}
                filings) are simplified district/state applications for sand, gravel, and stone quarries under 5
                hectares. Mixing them with coal and iron-ore mines makes mining clearances look artificially fast, so we
                report major mines and small quarries separately throughout.
              </li>
              <li>
                <b>Solar, wind, and transmission lines:</b> Utility-scale solar parks, wind farms, and high-voltage
                power lines are exempt from environmental clearance under the EIA Notification 2006, but must obtain
                forest and wildlife clearances whenever they cross forest land or protected corridors. We track thermal
                and hydro stations under environmental clearance and track solar, wind, and grid lines through forest
                and wildlife permissions.
              </li>
            </ul>

            <h2>5. Auditing the ministry’s published duration counter</h2>
            <p>
              On PARIVESH 2.0’s Common Application Form endpoint, granted proposals carry an official integer field,{" "}
              <code>proposal_duration</code>. We verified the exact reset formula directly against{" "}
              <span className="rt-num">{fmtInt(pillar3.audit_summary.direct_caf_endpoint_verified_n ?? 15)}</span>{" "}
              granted CAF payloads and evaluated it across all{" "}
              <span className="rt-num">{fmtInt(pillar3.audit_summary.granted_with_official_duration_n)}</span> mature
              granted clearances from their timestamped workflow logs:{" "}
              <b>{fmtPct(pillar3.audit_summary.understated_gt_1d_pct)}</b> understate actual government desk time
              because whenever officials raise an initial scrutiny question (EDS) before formal acceptance, the
              published counter discards the earlier scrutiny spell and restarts from zero after the company replies.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
