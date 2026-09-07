import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  JH_HEADLINE_SERIES,
  JH_HEADLINE_YEAR,
  jh2055,
  jh4055,
  jhDemand22,
  jhFunctional,
} from "../data/jharkhand/police";
import { formatCrore } from "../lib/money";

export function JhPolicePage() {
  const hero = pickAmount(jhFunctional, JH_HEADLINE_YEAR, JH_HEADLINE_SERIES);
  const run = pickAmount(jh2055, JH_HEADLINE_YEAR, JH_HEADLINE_SERIES);
  const cap = pickAmount(jh4055, JH_HEADLINE_YEAR, JH_HEADLINE_SERIES);
  const mixed = pickAmount(jhDemand22, JH_HEADLINE_YEAR, JH_HEADLINE_SERIES);
  const idx = getIndexRow("jharkhand");
  if (!hero || !run || !cap || !mixed || !idx) throw new Error("Missing Jharkhand gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Jharkhand Police</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not jails,
        not disaster management, not the whole Home department.
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
        run={jh2055}
        cap={jh4055}
        caption="Spent, plan, updated plan, and next plan. Printed in lakhs; shown in crore."
      />
      <HeadSplit run={run} cap={cap} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The Home grant is not only police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The Assembly also votes a larger Home grant that includes jails, disaster offices, and
          other heads. That bigger number is not Police.
        </p>
        <p className="mt-4 text-ink/80">
          Home grant, {mixed.fiscalYear} plan: <Money money={mixed} size="row" />
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
          { id: "book", label: "Book", detail: "Jharkhand Annual Financial Statement 2026-27" },
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
          A research summary lists Jharkhand police at ₹{idx.be2526.toLocaleString("en-IN")} crore
          for 2025-26. That is not this official 2026-27 plan of ₹{formatCrore(hero.crore)} crore.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          Account codes in the book: 2055 (running), 4055 (buildings).{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/compare?left=maharashtra&right=jharkhand">Compare with Maharashtra</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
