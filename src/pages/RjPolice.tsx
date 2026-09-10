import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  RJ_HEADLINE_SERIES,
  RJ_HEADLINE_YEAR,
  rj2055,
  rj4055,
  rjDemand18,
  rjFunctional,
} from "../data/rajasthan/police";
import { formatCrore } from "../lib/money";

export function RjPolicePage() {
  const hero = pickAmount(rjFunctional, RJ_HEADLINE_YEAR, RJ_HEADLINE_SERIES);
  const run = pickAmount(rj2055, RJ_HEADLINE_YEAR, RJ_HEADLINE_SERIES);
  const cap = pickAmount(rj4055, RJ_HEADLINE_YEAR, RJ_HEADLINE_SERIES);
  const mixed = pickAmount(rjDemand18, RJ_HEADLINE_YEAR, RJ_HEADLINE_SERIES);
  const idx = getIndexRow("rajasthan");
  if (!hero || !run || !cap || !mixed || !idx) throw new Error("Missing Rajasthan gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Rajasthan Police</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not jails,
        not the whole Home demand, not a Budget at a Glance speech slice.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Running costs ₹{formatCrore(run.crore)} crore · Buildings and gear ₹
          {formatCrore(cap.crore)} crore.
        </p>
      </div>

      <PrintedColumns
        run={rj2055}
        cap={rj4055}
        caption="Spent, plan, updated plan, and next plan. Printed in thousands; shown in crore."
      />
      <HeadSplit run={run} cap={cap} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The Home demand is not only police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Demand 18 also carries public works, housing, and other Home lines. That bigger number is
          not Police. The Police number above is running costs plus buildings and gear.
        </p>
        <p className="mt-4 text-ink/80">
          Home demand, {mixed.fiscalYear} plan: <Money money={mixed} size="row" />
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Salaries not split by station</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Named police stations are not printed as allotments. We do not divide this total by the
          number of stations.
        </p>
      </section>

      <TraceRail
        stops={[
          {
            id: "book",
            label: "Book",
            detail: "Rajasthan Vol2b 2055 सारांश + Vol3a 4055 सारांश, 2026-27",
          },
          { id: "major", label: "Police", money: hero, detail: "Running the force plus buildings and gear." },
          { id: "run", label: "Running costs", money: run },
          { id: "cap", label: "Buildings and gear", money: cap },
          {
            id: "object",
            label: "Salaries",
            empty: "A statewide salaries total is not typed here.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at the police line. We do not divide that total by the number of stations.",
          },
        ]}
      />

      <section className="index-slip mt-10">
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          A research summary lists Rajasthan police at ₹{idx.be2526.toLocaleString("en-IN")} crore
          for 2025-26. That is not this official 2026-27 plan of ₹{formatCrore(hero.crore)} crore.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
          <CitationFootnote citationId={cap.citationId} />
          <CitationFootnote citationId={mixed.citationId} />
        </ol>
        <p className="mt-6">
          Account codes in the book: 2055 (running), 4055 (buildings).{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/compare?left=maharashtra&right=rajasthan">Compare with Maharashtra</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
