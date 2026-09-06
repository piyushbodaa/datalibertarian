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
      <p className="kicker">GOLD · Home Book · 2055 + 4055</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Gujarat Police spending
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        Demand <strong>043 Police</strong> is head <strong>2055</strong> only. Capital outlay{" "}
        <strong>4055</strong> is printed under Demand 046 — we take that 4055 line, not the mixed
        Demand 046 total, and not jails (2056) or courts (2014).
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Budget estimate · FY {hero.fiscalYear}</p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>

      <PrintedColumns
        run={gj2055}
        cap={gj4055}
        caption="Each bar is 2055 plus 4055 as printed in crore. Actuals, Budget, and Revised are different kinds of figure — not one trend."
      />
      <HeadSplit run={run} cap={cap} />
      <RankedHatch
        showAll
        items={gj2055Minors}
        fiscalYear={GJ_HEADLINE_YEAR}
        series={GJ_HEADLINE_SERIES}
        shareOf={run}
        title="2055 minor heads"
        note="Share of 2055 Police, FY 2026-27 budget. Printed I-Summary. Lines sum to 2055."
      />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Object heads · not a printed योग</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Object 01 salaries not summed</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The detailed volume prints 0100 Salaries under each sub-head. There is no statewide object
          01 योग typed here. The book stops at minor heads for this GOLD pass. We do not divide
          district police by N stations.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Home Department Budget Estimates 2026-27" },
          { id: "demand", label: "Demand 043 · 2055", money: run, detail: "Police running costs, crore as printed." },
          { id: "cap", label: "4055 (from Demand 046)", money: cap, detail: "Police capital line only — not Demand 046 total." },
          { id: "minor", label: "Minor 109 District Police", money: district },
          {
            id: "object",
            label: "Object 01 Salaries",
            empty: "No statewide printed योग typed. Detailed 0100 lines sit under each sub-head.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at the commissionerate / district force / object grain. We do not divide that total by N stations.",
          },
        ]}
      />

      <section className="index-slip mt-10">
        <p className="kicker">INDEX · PRS AFS</p>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          PRS AFS Police functional for Gujarat, FY 2025-26 budget, is ₹
          {idx.be2526.toLocaleString("en-IN")} crore. That is a different slip — not this White Book
          hero of ₹{formatCrore(hero.crore)} crore (FY 2026-27 budget).
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/states">States</Link> · <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
