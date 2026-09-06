import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  TN_HEADLINE_SERIES,
  TN_HEADLINE_YEAR,
  tn2055,
  tn4055,
  tnDemand22Voted,
  tnFunctional,
} from "../data/tamil-nadu/police";
import { formatCrore } from "../lib/money";

export function TnPolicePage() {
  const hero = pickAmount(tnFunctional, TN_HEADLINE_YEAR, TN_HEADLINE_SERIES);
  const run = pickAmount(tn2055, TN_HEADLINE_YEAR, TN_HEADLINE_SERIES);
  const cap = pickAmount(tn4055, TN_HEADLINE_YEAR, TN_HEADLINE_SERIES);
  const mixed = pickAmount(tnDemand22Voted, TN_HEADLINE_YEAR, TN_HEADLINE_SERIES);
  const idx = getIndexRow("tamil-nadu");
  if (!hero || !run || !cap || !mixed || !idx) throw new Error("Missing Tamil Nadu gold figures");

  return (
    <article>
      <p className="kicker">GOLD · Demand 22 slices · 2055 + 4055</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Tamil Nadu Police spending
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        Interim Budget 2026-27, Demand 22. Headline is heads <strong>2055</strong> plus{" "}
        <strong>4055</strong> as printed (thousands converted to crore). Demand 22 also carries
        courts, elections, secretariat, public works and other home services — those are not Police.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Budget estimate · FY {hero.fiscalYear}</p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>

      <PrintedColumns
        run={tn2055}
        cap={tn4055}
        caption="Each bar is 2055 plus 4055. Printed in thousands; shown in crore. Actuals, Budget, and Revised are not one trend."
      />
      <HeadSplit run={run} cap={cap} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Related demand · quieter</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Demand 22 is not police-only</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The voted Demand 22 total includes 2014, 2015, 2051, 2052, 2059, 2070, 2235 and other
          heads. Do not treat it as Police spending. The Police number above is 2055 + 4055.
        </p>
        <p className="mt-4 text-ink/80">
          Demand 22 voted, FY {mixed.fiscalYear} budget: <Money money={mixed} size="row" />
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Object heads · not typed</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Object 01 not a statewide योग</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Object-head pages exist in the Demand book under each establishment. A statewide salaries
          योग is not typed this pass. Named police stations are not printed as allotments.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Demand No. 22 Police, Interim Budget 2026-27" },
          { id: "major", label: "2055 + 4055", money: hero, detail: "Functional Police. Not the mixed Demand 22 total." },
          { id: "run", label: "Major 2055", money: run },
          { id: "cap", label: "Major 4055", money: cap },
          {
            id: "object",
            label: "Object 01 Salaries",
            empty: "Object heads not typed as a statewide योग — detailed pages not summed.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at the major-head grain typed here. We do not divide that total by N stations.",
          },
        ]}
      />

      <section className="index-slip mt-10">
        <p className="kicker">INDEX · PRS AFS</p>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          PRS AFS Police functional for Tamil Nadu, FY 2025-26 budget, is ₹
          {idx.be2526.toLocaleString("en-IN")} crore. That is a different slip — not this Demand 22
          2055+4055 hero of ₹{formatCrore(hero.crore)} crore (FY 2026-27 budget).
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
