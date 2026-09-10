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
import { formatCrore } from "../lib/money";

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
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Maharashtra Police</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not the
        whole Home department. Mumbai Police sits here, not in the city corporation book.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Running costs ₹{formatCrore(run.crore)} crore
          <CitationChip citationId={run.citationId} compact /> · Buildings and gear ₹
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
            <span className="font-display text-lg font-semibold">Running costs</span>
            <span className="mt-0.5 block text-sm text-ink/65">Pay, stations, investigation, training.</span>
          </dt>
          <dd className="m-0 sm:text-right">
            <Money money={run} size="row" />
          </dd>
        </div>
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
          <dt>
            <span className="font-display text-lg font-semibold">Buildings and gear</span>
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
          Spent, plan, updated plan, and next plan. Amounts in crore.
        </p>
        <div className="mt-6">
          <LedgerTable
            items={[police2055, police4055, ...police2055Lines]}
            caption="Running costs, buildings and gear, then the printed lines under running costs."
          />
        </div>
      </section>

      <RankedHatch items={police2055Lines} fiscalYear={HEADLINE_YEAR} series={HEADLINE_SERIES} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Salaries not split by station</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          District police is in the book as a statewide line. We do not divide it by the number of
          stations.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Maharashtra state budget, Home, 2026-27" },
          { id: "major", label: "Police", money: hero, detail: "Running the force plus buildings and gear." },
          { id: "run", label: "Running costs", money: run },
          {
            id: "object",
            label: "Salaries",
            empty: "A statewide salaries total is not typed here.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book does not print a rupee for each station. Mumbai Police is state police, not BMC.",
          },
        ]}
      />

      <section className="carbon-sheet mt-14 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold text-ink/80">
          The Assembly also votes a larger Home grant
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          That bigger number includes courts and other offices. It is not Police. The Police number
          above is running costs plus buildings and gear.
        </p>
        <p className="mt-4 text-ink/80">
          Home grant, 2026-27 plan: <Money money={b1} size="row" />
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
          Account codes in the book: 2055 (running), 4055 (buildings).{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/sources">Method</Link>.
        </p>
      </section>
    </article>
  );
}
