import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  OD_HEADLINE_SERIES,
  OD_HEADLINE_YEAR,
  od2055,
  odDemand01,
  odFunctional,
} from "../data/odisha/police";
import { formatCrore, SERIES_LABEL } from "../lib/money";

export function OdPolicePage() {
  const hero = pickAmount(odFunctional, OD_HEADLINE_YEAR, OD_HEADLINE_SERIES);
  const run = pickAmount(od2055, OD_HEADLINE_YEAR, OD_HEADLINE_SERIES);
  const mixed = pickAmount(odDemand01, OD_HEADLINE_YEAR, OD_HEADLINE_SERIES);
  const idx = getIndexRow("odisha");
  if (!hero || !run || !mixed || !idx) throw new Error("Missing Odisha gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Odisha Police</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police. Buildings and vehicles are not printed as
        a separate police line in this Home demand. Not jails, not courts.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Running costs ₹{formatCrore(run.crore)} crore. Buildings and gear: no figure yet.
        </p>
      </div>

      <ol className="mt-8 max-w-xl space-y-3">
        {od2055.amounts.map((m) => (
          <li key={`${m.fiscalYear}-${m.series}`} className="flex justify-between gap-4 text-sm">
            <span>
              {SERIES_LABEL[m.series]} {m.fiscalYear}
            </span>
            <Money money={m} size="row" />
          </li>
        ))}
      </ol>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The Home grant is not only police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The Assembly also votes a larger Home grant that includes courts, jails, elections, and
          other offices. Capital in this demand is public works and housing, not a police buildings
          line. That bigger number is not Police.
        </p>
        <p className="mt-4 text-ink/80">
          Home grant, {mixed.fiscalYear} plan: <Money money={mixed} size="row" />
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Odisha Demand 01 Home, 2026-27" },
          { id: "run", label: "Running costs", money: run },
          {
            id: "cap",
            label: "Buildings and gear",
            empty: "Not printed as a police line in this book.",
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
          A research summary lists Odisha police at ₹{idx.be2526.toLocaleString("en-IN")} crore for
          2025-26. That is not this official 2026-27 plan of ₹{formatCrore(hero.crore)} crore.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          Account code in the book: 2055 (running). 4055 is not a major head here.{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/compare?left=maharashtra&right=odisha">Compare with Maharashtra</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
