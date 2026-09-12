import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { jurisdictions } from "../data/states";
import { Money } from "../components/Money";
import { ShareSplit } from "../components/ShareSplit";
import { formatCrore } from "../lib/money";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  stateTotalExpenditure,
} from "../data/maharashtra-police";
import {
  UNION_DEBT_SERIES,
  UNION_DEBT_YEAR,
  UNION_TOTAL_SERIES,
  UNION_TOTAL_YEAR,
  unionOutstandingLiabilities,
  unionTotalExpenditure,
} from "../data/union/budget-at-a-glance";
import {
  demand51Net,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";

const READ_STATES = jurisdictions.filter((state) => state.kind === "state" && state.tier === "gold");

export function HomePage() {
  const debt = pickAmount(unionOutstandingLiabilities, UNION_DEBT_YEAR, UNION_DEBT_SERIES);
  const unionTotal = pickAmount(unionTotalExpenditure, UNION_TOTAL_YEAR, UNION_TOTAL_SERIES);
  const policeDemand = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const mhState = stateTotalExpenditure.find(
    (m) => m.fiscalYear === HEADLINE_YEAR && m.series === HEADLINE_SERIES,
  );
  const mhPolice = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  if (!debt || !unionTotal || !policeDemand || !mhState || !mhPolice) {
    throw new Error("Missing home layer figures");
  }
  const citeIds = [...new Set([debt, unionTotal, policeDemand, mhState, mhPolice].map((money) => money.citationId))];

  return (
    <article>
      <p className="kicker">Public ledger</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Government spending, as printed
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Official budget books only. Every rupee is cited. Empty means we have not read that book
        yet — not that it is zero. This is not an NGO or grant tracker.
      </p>

      <nav aria-label="Explore the ledger" className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link to="/states" className="docket-door layer-state"><h2 className="font-display text-xl">Explore a state →</h2><p className="mt-2 text-sm">Police budgets from {READ_STATES.length} official state books.</p></Link>
        <Link to="/compare?left=maharashtra&right=karnataka" className="docket-door layer-union"><h2 className="font-display text-xl">Compare states →</h2><p className="mt-2 text-sm">Read plans and actual spending side by side.</p></Link>
        <Link to="/inflation" className="docket-door"><h2 className="font-display text-xl">Explore inflation →</h2><p className="mt-2 text-sm">Follow observed prices and their sources.</p></Link>
      </nav>
      <section className="mt-8 border-y border-ink/20 py-6">
        <h2 className="font-display text-xl">Union outstanding liabilities</h2>
        <p className="mt-2 text-sm text-ink/70">Budget estimate for the end of {UNION_DEBT_YEAR}. Government of India only.</p>
        <p className="num mt-3 text-2xl sm:text-4xl">₹{formatCrore(debt.crore)} crore <CitationChip citationId={debt.citationId} /></p>
      </section>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <section className="docket-door layer-union">
          <h2 className="font-display text-xl font-semibold tracking-tight">Union spend</h2>
          <p className="layer-caption mt-1">What the Union budget planned to spend, 2026-27</p>
          <div className="mt-4">
            <Money money={unionTotal} size="hero" showSeries />
          </div>
          <p className="mt-3 text-sm text-ink/70">
            Centre police only: <Money money={policeDemand} size="row" />
          </p>
          <p className="mt-4">
            <Link to="/union" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the Union book
            </Link>
          </p>
        </section>

        <section className="docket-door layer-state">
          <h2 className="font-display text-xl font-semibold tracking-tight">One state book</h2>
          <p className="layer-caption mt-1">Maharashtra’s whole budget, 2026-27</p>
          <div className="mt-4">
            <Money money={mhState} size="hero" showSeries />
          </div>
          <p className="mt-2 text-sm text-ink/65">
            {READ_STATES.length} states have official police figures on this site.
          </p>
          <ShareSplit compact police={mhPolice} state={mhState} />
          <p className="mt-4">
            <Link to="/states" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              All states
            </Link>
          </p>
        </section>
      </div>

      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1">
        <Link to="/compare?left=maharashtra&right=karnataka" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Compare two states
        </Link>
        <Link to="/search" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Search
        </Link>
      </p>

      <h2 className="mt-12 font-display text-xl font-semibold tracking-tight">States we have read</h2>
      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3" aria-label="States we have read">
        {READ_STATES.map(({ slug, name }) => (
          <li key={slug}>
            <Link to={`/${slug}/police`} className="inline-flex min-h-11 items-center text-ink no-underline hover:text-rust">
              {name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-ink/70">Coverage: <Link to="/union/police">Centre police</Link> and state police books. <Link to="/municipal">City</Link> and <Link to="/gram">village</Link> budgets have no figures yet. Missing is not zero. Union and state totals must not be added into an India total.</p>
      <section className="mt-10 text-sm" aria-label="Sources for this overview">
        <h2 className="font-display text-xl">Sources for this overview</h2>
        <ol className="mt-4 list-decimal space-y-4 pl-5">{citeIds.map((id) => <CitationFootnote key={id} citationId={id} />)}</ol>
      </section>
    </article>
  );
}
