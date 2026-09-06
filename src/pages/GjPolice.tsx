import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { RankedHatch } from "../components/RankedHatch";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import {
  GJ_HEADLINE_SERIES,
  GJ_HEADLINE_YEAR,
  gj2055,
  gj2055Minors,
  gj4055,
  gjFunctional,
} from "../data/gujarat/police";
import { getIndexRow } from "../data/prs-index/afs-police";
import { formatCrore } from "../lib/money";

export function GjPolicePage() {
  const hero = pickAmount(gjFunctional, GJ_HEADLINE_YEAR, GJ_HEADLINE_SERIES);
  const run = pickAmount(gj2055, GJ_HEADLINE_YEAR, GJ_HEADLINE_SERIES);
  const cap = pickAmount(gj4055, GJ_HEADLINE_YEAR, GJ_HEADLINE_SERIES);
  const district = pickAmount(
    gj2055Minors.find((l) => l.id === "gj-2055-109")!,
    GJ_HEADLINE_YEAR,
    GJ_HEADLINE_SERIES,
  );
  const idx = getIndexRow("gujarat");
  if (!hero || !run || !cap || !district || !idx) throw new Error("Missing Gujarat gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Gujarat Police</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not jails
        or courts.
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
        run={gj2055}
        cap={gj4055}
        caption="Spent, plan, updated plan, and next plan. Amounts in crore."
      />
      <HeadSplit run={run} cap={cap} />
      <RankedHatch
        showAll
        items={gj2055Minors}
        fiscalYear={GJ_HEADLINE_YEAR}
        series={GJ_HEADLINE_SERIES}
        shareOf={run}
        title="Where the running-cost rupee sits"
        note="Share of running costs, 2026-27 plan. Printed lines. They add up to running costs."
      />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Salaries not split by station</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The book prints pay under each office. A statewide salaries total is not typed here. We
          do not divide district police by the number of stations.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Gujarat state budget, Home, 2026-27" },
          { id: "run", label: "Running costs", money: run },
          { id: "cap", label: "Buildings and gear", money: cap, detail: "Police buildings line only — not the whole Home capital grant." },
          { id: "minor", label: "District police", money: district },
          {
            id: "object",
            label: "Salaries",
            empty: "A statewide salaries total is not typed here.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at district force. We do not divide that total by the number of stations.",
          },
        ]}
      />

      <section className="index-slip mt-10">
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          A research summary lists Gujarat police at ₹{idx.be2526.toLocaleString("en-IN")} crore
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
          <Link to="/states">All states</Link> · <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
