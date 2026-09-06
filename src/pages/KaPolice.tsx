import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getIndexRow } from "../data/prs-index/afs-police";
import {
  KA_HEADLINE_SERIES,
  KA_HEADLINE_YEAR,
  ka109,
  ka2055,
  ka4055,
  kaDemand05Home,
  kaFunctional,
} from "../data/karnataka/police";
import { formatCrore } from "../lib/money";

export function KaPolicePage() {
  const hero = pickAmount(kaFunctional, KA_HEADLINE_YEAR, KA_HEADLINE_SERIES);
  const run = pickAmount(ka2055, KA_HEADLINE_YEAR, KA_HEADLINE_SERIES);
  const cap = pickAmount(ka4055, KA_HEADLINE_YEAR, KA_HEADLINE_SERIES);
  const district = pickAmount(ka109, KA_HEADLINE_YEAR, KA_HEADLINE_SERIES);
  const mixed = pickAmount(kaDemand05Home, KA_HEADLINE_YEAR, KA_HEADLINE_SERIES);
  const idx = getIndexRow("karnataka");
  if (!hero || !run || !cap || !district || !mixed || !idx) {
    throw new Error("Missing Karnataka gold figures");
  }

  return (
    <article>
      <p className="kicker">GOLD · Expenditure Volume-1 · 2055 + 4055</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Karnataka Police spending
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        Demand <strong>05 Home</strong>, Expenditure Volume-1 2026-27. Headline is heads{" "}
        <strong>2055</strong> plus <strong>4055</strong> as printed (lakhs converted to crore). The
        same Demand also carries jails, home guards, fire, prosecutions and public works — those
        are not Police.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Budget estimate · FY {hero.fiscalYear}</p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>

      <PrintedColumns
        run={ka2055}
        cap={ka4055}
        caption="Each bar is 2055 plus 4055. Printed in lakhs; shown in crore. Actuals, Budget, and Revised are not one trend."
      />
      <HeadSplit run={run} cap={cap} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Related demand · quieter</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Demand 05 Home is not police-only</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The Home department total includes 2014, 2056 jails, 2070 home guards and fire, 2235,
          4059 and 4070. Do not treat it as Police spending. The Police number above is 2055 +
          4055. Transport is a separate slice of the same Demand 05 and is not added in.
        </p>
        <p className="mt-4 text-ink/80">
          Demand 05 Home, FY {mixed.fiscalYear} budget: <Money money={mixed} size="row" />
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">District force</p>
        <h2 className="mt-2 font-display text-xl font-semibold">109 District establishment</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Printed HOA total for 2055-00-109-1-01 Police Establishment in Existing Districts — not a
          per-station share, and not Bengaluru civic.
        </p>
        <p className="mt-4 text-ink/80">
          FY {district.fiscalYear} budget: <Money money={district} size="row" />
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Object heads · not a statewide योग</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Object 01 not summed</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Volume-1 prints 002 Basic Pay and related objects under each scheme. There is no
          statewide object 01 योग typed this pass. Named police stations are not printed as
          allotments. We do not divide district establishment by N thanas.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Expenditure Volume-1 2026-27, Demand 05 Home" },
          { id: "major", label: "2055 + 4055", money: hero, detail: "Functional Police. Not the mixed Home demand." },
          { id: "run", label: "Major 2055", money: run },
          { id: "cap", label: "Major 4055", money: cap },
          { id: "minor", label: "109 District establishment", money: district },
          {
            id: "object",
            label: "Object 01 Salaries",
            empty: "No statewide printed योग typed. Pay objects sit under each 2055 scheme.",
          },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at district establishment / scheme. We do not divide that total by N stations.",
          },
        ]}
      />

      <section className="index-slip mt-10">
        <p className="kicker">INDEX · PRS AFS</p>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          PRS AFS Police functional for Karnataka, FY 2025-26 budget, is ₹
          {idx.be2526.toLocaleString("en-IN")} crore. That is a zinc slip. This White Book hero is ₹
          {formatCrore(hero.crore)} crore (FY 2026-27 budget) from Expenditure Volume-1, not from
          PRS.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/states">States</Link>
          {" · "}
          <Link to="/compare?left=maharashtra&right=karnataka">Compare with Maharashtra</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
