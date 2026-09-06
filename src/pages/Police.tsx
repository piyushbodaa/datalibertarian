import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { LedgerTable } from "../components/LedgerTable";
import { Money } from "../components/Money";
import { HeadSplit } from "../components/HeadSplit";
import { PrintedColumns } from "../components/PrintedColumns";
import { RankedHatch } from "../components/RankedHatch";
import { ShareSplit } from "../components/ShareSplit";
import {
  functionalPolice,
  grantB1,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  police2055,
  police2055Lines,
  police4055,
  stateTotalExpenditure,
} from "../data/maharashtra-police";
import { TraceRail } from "../components/TraceRail";
import { formatCrore, SERIES_PLAIN } from "../lib/money";

export function PolicePage() {
  const hero = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  const b1 = pickAmount(grantB1, HEADLINE_YEAR, HEADLINE_SERIES);
  const state = stateTotalExpenditure.find(
    (m) => m.fiscalYear === HEADLINE_YEAR && m.series === HEADLINE_SERIES,
  );
  if (!hero || !run || !cap || !b1 || !state) throw new Error("Missing headline series");

  const usedIds = [
    hero.citationId,
    run.citationId,
    cap.citationId,
    b1.citationId,
    state.citationId,
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  return (
    <article>
      <p className="kicker">GOLD · White Book · 2055 + 4055</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Maharashtra Police spending
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        This is what the state books call Police: pay and running costs (head{" "}
        <strong>2055</strong>) plus buildings and equipment (head <strong>4055</strong>). It is not
        the entire Home Department. Mumbai Police is state police, not a municipal budget.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">
          {hero.series === "be" ? "Budget estimate" : hero.series} · FY {hero.fiscalYear}
        </p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          {SERIES_PLAIN[hero.series]}. Running costs ₹{formatCrore(run.crore)} crore
          <CitationChip citationId={run.citationId} compact /> plus capital ₹
          {formatCrore(cap.crore)} crore
          <CitationChip citationId={cap.citationId} compact />.
        </p>
      </div>

      <PrintedColumns run={police2055} cap={police4055} />
      <ShareSplit police={hero} state={state} />
      <HeadSplit run={run} cap={cap} />

      <dl className="mt-10 divide-y divide-ink/15 border-y border-ink/20">
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
          <dt>
            <span className="font-display text-lg font-semibold">Running costs · 2055</span>
            <span className="mt-0.5 block text-sm text-ink/65">Pay, stations, investigation, training.</span>
          </dt>
          <dd className="m-0 sm:text-right">
            <Money money={run} size="row" />
          </dd>
        </div>
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
          <dt>
            <span className="font-display text-lg font-semibold">Capital · 4055</span>
            <span className="mt-0.5 block text-sm text-ink/65">Buildings, vehicles, equipment.</span>
          </dt>
          <dd className="m-0 sm:text-right">
            <Money money={cap} size="row" />
          </dd>
        </div>
      </dl>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">The police ledger</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          <span className="hidden md:inline">
            Columns are four official series from the same White Book.{" "}
          </span>
          <span className="md:hidden">
            Each line shows the FY 2026-27 budget first, then revised, prior budget, and actuals
            underneath.{" "}
          </span>
          <strong>Actuals</strong> is money booked. <strong>Budget</strong> is the plan.{" "}
          <strong>Revised</strong> is the mid-year plan. Amounts in crore of rupees.
        </p>
        <div className="mt-6">
          <LedgerTable
            items={[police2055, police4055, ...police2055Lines]}
            caption="2055 net total, 4055 capital, then 2055 voted lines as printed."
          />
        </div>
      </section>

      <RankedHatch items={police2055Lines} fiscalYear={HEADLINE_YEAR} series={HEADLINE_SERIES} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Object heads · not typed</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Object 01 under 109 not opened</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The White Book I-Summary of 2055 minors is typed. Object 01 salaries under 109 District
          Police is not typed this pass — detailed object pages were not opened. We do not guess
          object 01, and we do not divide district police by N stations.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Home Department White Book 2026-27" },
          { id: "major", label: "2055 + 4055", money: hero, detail: "Functional Police. Not Grant B-1." },
          { id: "run", label: "Major 2055", money: run },
          {
            id: "object",
            label: "Object 01 Salaries",
            empty: "Object heads not typed — detailed White Book pages not on disk this pass.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at the minor-head grain. Mumbai Police is state police, not BMC.",
          },
        ]}
      />

      <section className="carbon-sheet mt-14 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Related grant · quieter</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-ink/80">
          Grant B-1 is not police-only
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          The Assembly votes Grant B-1, labelled &ldquo;Police Administration.&rdquo; That grant
          also includes <strong>courts</strong> (Administration of Justice, head 2014) and{" "}
          <strong>other home services</strong> (head 2070). Do not treat it as Police spending. The
          Police number above is 2055 + 4055.
        </p>
        <p className="mt-4 text-ink/80">
          Grant B-1 total, FY {b1.fiscalYear} {b1.series === "be" ? "budget" : b1.series}:{" "}
          <Money money={b1} size="row" />
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {usedIds.map((id) => (
            <CitationFootnote key={id} citationId={id} />
          ))}
        </ol>
        <p className="mt-6 max-w-2xl">
          INDEX (PRS AFS Police functional, FY 2025-26 budget) lists Maharashtra at ₹33,743 crore.
          That is a different book and year-column — not this White Book hero of ₹
          {formatCrore(hero.crore)} crore. <Link to="/states">INDEX hatch</Link>. Method:{" "}
          <Link to="/sources">Sources</Link>.
        </p>
      </section>
    </article>
  );
}
