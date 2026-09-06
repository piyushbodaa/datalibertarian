import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { apLastFound } from "../data/prs-index/afs-police";
import {
  AP_HEADLINE_SERIES,
  AP_HEADLINE_YEAR,
  ap2055,
  ap4055,
  apDemandX,
  apFunctional,
} from "../data/andhra-pradesh/police";
import { formatCrore } from "../lib/money";

export function ApPolicePage() {
  const hero = pickAmount(apFunctional, AP_HEADLINE_YEAR, AP_HEADLINE_SERIES);
  const run = pickAmount(ap2055, AP_HEADLINE_YEAR, AP_HEADLINE_SERIES);
  const cap = pickAmount(ap4055, AP_HEADLINE_YEAR, AP_HEADLINE_SERIES);
  const mixed = pickAmount(apDemandX, AP_HEADLINE_YEAR, AP_HEADLINE_SERIES);
  if (!hero || !run || !cap || !mixed) throw new Error("Missing Andhra Pradesh gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Andhra Pradesh Police
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not jails,
        not fire, not the whole Home department.
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
        run={ap2055}
        cap={ap4055}
        caption="Spent, plan, updated plan, and next plan. Printed in lakhs; shown in crore."
      />
      <HeadSplit run={run} cap={cap} />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The Home grant is not only police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The Assembly also votes a larger Home grant that includes jails, fire, printing, home
          guards, and prosecutions. That bigger number is not Police. One police office inside the
          grant is not the statewide total either.
        </p>
        <p className="mt-4 text-ink/80">
          Home grant, {mixed.fiscalYear} plan: <Money money={mixed} size="row" />
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Salaries not split by station</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Named police stations are not printed as allotments. We do not divide the state total by
          the number of stations.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Andhra Pradesh Annual Financial Statement, 2026-27" },
          {
            id: "major",
            label: "Police",
            money: hero,
            detail: "Running the force plus buildings and gear.",
          },
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
          A research summary listed ₹{apLastFound.be2425.crore.toLocaleString("en-IN")} crore as a
          2024-25 plan. That is not this official 2026-27 plan of ₹{formatCrore(hero.crore)} crore.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
          <CitationFootnote citationId={mixed.citationId} />
        </ol>
        <p className="mt-6">
          Account codes in the book: 2055 (running), 4055 (buildings).{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/compare?left=andhra-pradesh&right=telangana">Compare with Telangana</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
