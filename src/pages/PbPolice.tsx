import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  PB_HEADLINE_SERIES,
  PB_HEADLINE_YEAR,
  pb2055,
  pb4055,
  pbFunctional,
} from "../data/punjab/police";
import { formatCrore } from "../lib/money";

export function PbPolicePage() {
  const hero = pickAmount(pbFunctional, PB_HEADLINE_YEAR, PB_HEADLINE_SERIES);
  const run = pickAmount(pb2055, PB_HEADLINE_YEAR, PB_HEADLINE_SERIES);
  const cap = pickAmount(pb4055, PB_HEADLINE_YEAR, PB_HEADLINE_SERIES);
  const idx = getIndexRow("punjab");
  if (!hero || !run || !cap || !idx) throw new Error("Missing Punjab gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Punjab Police</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not jails,
        not courts, not home guards.
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
        run={pb2055}
        cap={pb4055}
        caption="Spent, plan, updated plan, and next plan. Printed in thousands; shown in crore."
      />
      <HeadSplit run={run} cap={cap} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The Home grant is not only police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Demand 12 Home Affairs also carries home guards and prosecutions on a separate capital
          line. Demand 36 Jails prints a buildings line under the same police capital code, but those
          amounts are jails — central jails, district jails, prison modernisation. That is not Police.
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
          { id: "book", label: "Book", detail: "Punjab Annual Financial Statement and Capital Demand 12, 2026-27" },
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
          A research summary lists Punjab police at ₹{idx.be2526.toLocaleString("en-IN")} crore for
          2025-26. That is not this official 2026-27 plan of ₹{formatCrore(hero.crore)} crore.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={run.citationId} />
          <CitationFootnote citationId={cap.citationId} />
        </ol>
        <p className="mt-6">
          Account codes in the book: 2055 (running), 4055 (buildings).{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/compare?left=punjab&right=haryana">Compare with Haryana</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
