import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { jurisdictions } from "../data/states";
import { healthBooks } from "../data/health/books";
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
      <p className="kicker">Public Spending · Primary Budget Archive</p>
      <h1 className="mt-2 font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
        Indian public finance, straight from official budget books
      </h1>
      <p className="mt-3 max-w-2xl text-ink/80">
        Every rupee figure on this platform is extracted directly from Annual Financial Statements and
        Demand books with inline citations. Missing fields indicate unread volumes, never zero
        spending — and Union, State, City, and Village totals are never summed into one headline.
      </p>

      <nav aria-label="Explore the ledger" className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link to="/states" className="docket-door layer-state">
          <p className="kicker">State Budgets</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Explore 28 state books →</h2>
          <p className="mt-1.5 text-sm text-ink/70">
            Police allocations across {READ_STATES.length} verified 2026–27 state budgets.
          </p>
        </Link>
        <Link to="/compare?left=maharashtra&right=karnataka" className="docket-door layer-union">
          <p className="kicker">Benchmarking</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Compare two budgets →</h2>
          <p className="mt-1.5 text-sm text-ink/70">
            Examine Revenue vs Capital, salary shares, and peer medians side by side.
          </p>
        </Link>
        <Link to="/inflation" className="docket-door layer-municipal">
          <p className="kicker">Consumer Prices</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Inflation &amp; CPI Watch →</h2>
          <p className="mt-1.5 text-sm text-ink/70">
            MoSPI item CPI indices compared with observed retail price averages.
          </p>
        </Link>
      </nav>

      <section className="carbon-sheet mt-8 p-6">
        <p className="kicker">Sovereign Debt · Union Government</p>
        <h2 className="mt-1 font-display text-lg font-semibold">Union outstanding liabilities ({UNION_DEBT_YEAR} BE)</h2>
        <p className="num mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          ₹{formatCrore(debt.crore)} crore <CitationChip citationId={debt.citationId} />
        </p>
        <p className="mt-2 text-sm text-ink/65">
          Budgeted year-end public debt and other liabilities for Government of India only.
        </p>
      </section>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <section className="carbon-sheet flex flex-col justify-between p-6">
          <div>
            <p className="kicker text-rust">Union Tier</p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Union total expenditure</h2>
            <p className="layer-caption mt-1">Total Union Budget allocation for FY 2026–27 (BE)</p>
            <div className="mt-4">
              <Money money={unionTotal} size="hero" showSeries />
            </div>
            <p className="mt-4 text-sm text-ink/75">
              Demand No. 51 (Centre Police &amp; CAPFs): <Money money={policeDemand} size="row" />
            </p>
          </div>
          <p className="mt-5 mb-0">
            <Link to="/union" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the Union book
            </Link>
          </p>
        </section>

        <section className="carbon-sheet flex flex-col justify-between p-6">
          <div>
            <p className="kicker text-zinc">State Benchmark</p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">One state book · Maharashtra</h2>
            <p className="layer-caption mt-1">Total budgeted expenditure, FY 2026–27 (BE)</p>
            <div className="mt-4">
              <Money money={mhState} size="hero" showSeries />
            </div>
            <p className="mt-2 text-sm text-ink/70">
              {READ_STATES.length} states now have verified official police figures published.
            </p>
            <ShareSplit compact police={mhPolice} state={mhState} />
          </div>
          <p className="mt-5 mb-0">
            <Link to="/states" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Browse all {READ_STATES.length} state budgets
            </Link>
          </p>
        </section>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            States with verified police budget books ({READ_STATES.length})
          </h2>
          <Link to="/compare?left=maharashtra&right=karnataka" className="text-sm font-semibold">
            Compare any two states →
          </Link>
        </div>
        <ul
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
          aria-label="States we have read"
        >
          {READ_STATES.map(({ slug, name }) => (
            <li key={slug}>
              <Link
                to={`/${slug}/police`}
                className="flex min-h-10 items-center justify-between rounded-md border border-[var(--rule)] bg-white px-3 py-2 text-sm font-medium text-ink no-underline transition hover:border-rust hover:text-rust"
              >
                <span>{name}</span>
                <span className="text-xs text-ink/40" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Health, City &amp; Village Budgets</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link to="/telangana/health" className="docket-door layer-state">
            <p className="kicker">State Health</p>
            <p className="mt-1 font-semibold">Health — {healthBooks.length + 1} state books</p>
            <p className="mt-1 text-xs text-ink/65">Medical &amp; public health major heads (2210/2211/4210)</p>
          </Link>
          <Link to="/municipal/ghmc" className="docket-door layer-municipal">
            <p className="kicker">City Corporation</p>
            <p className="mt-1 font-semibold">GHMC (Hyderabad)</p>
            <p className="mt-1 text-xs text-ink/65">Greater Hyderabad Municipal Corporation 2025–26 BE</p>
          </Link>
          <Link to="/gram" className="docket-door layer-gram">
            <p className="kicker">Rural Local Bodies</p>
            <p className="mt-1 font-semibold">Telangana Villages (PR&amp;RD)</p>
            <p className="mt-1 text-xs text-ink/65">State rural development major heads 2515 + 4515</p>
          </Link>
        </div>
      </section>

      <section className="mt-12 text-sm" aria-label="Sources for this overview">
        <h2 className="font-display text-xl font-semibold">Sources for this overview</h2>
        <ol className="mt-4 list-decimal space-y-4 pl-5">
          {citeIds.map((id) => (
            <CitationFootnote key={id} citationId={id} />
          ))}
        </ol>
      </section>
    </article>
  );
}
