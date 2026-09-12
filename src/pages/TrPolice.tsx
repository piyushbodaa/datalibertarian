import { PoliceOverview } from "../components/PoliceOverview";
import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  TR_HEADLINE_SERIES,
  TR_HEADLINE_YEAR,
  tr2055,
  tr4055,
  trFunctional,
} from "../data/tripura/police";
import { formatCrore } from "../lib/money";

export function TrPolicePage() {
  const hero = pickAmount(trFunctional, TR_HEADLINE_YEAR, TR_HEADLINE_SERIES);
  const run = pickAmount(tr2055, TR_HEADLINE_YEAR, TR_HEADLINE_SERIES);
  const cap = pickAmount(tr4055, TR_HEADLINE_YEAR, TR_HEADLINE_SERIES);
  const idx = getIndexRow("tripura");
  if (!hero || !run || !cap || !idx) throw new Error("Missing Tripura gold figures");

  return (
    <article>
      <PoliceOverview name="Tripura" description="What the state budget set aside to run the police and to build or buy for them. Not jails, not courts." hero={hero} run={run} cap={cap} runningLine={tr2055} capitalLine={tr4055} caption="Spent, plan, updated plan, and next plan. Printed in lakhs; shown in crore." />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Salaries not split by station</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Named police stations are not printed as allotments. We do not divide this total by the
          number of stations.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Tripura Annual Financial Statement 2026-27" },
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
          A research summary lists Tripura police at ₹{idx.be2526.toLocaleString("en-IN")} crore for
          2025-26. That is not this official 2026-27 plan of ₹{formatCrore(hero.crore)} crore.
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
          <Link to="/compare?left=maharashtra&right=tripura">Compare with Maharashtra</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
