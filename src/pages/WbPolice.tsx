import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { pickAmount } from "../data/maharashtra-police";
import { RankedHatch } from "../components/RankedHatch";
import { TraceRail } from "../components/TraceRail";
import {
  wb2055Gross,
  wb2055Net,
  wb4055,
  wbArms,
  wbClothing,
  wbFunctional,
  wbSalariesDesk,
} from "../data/west-bengal/police";
import { formatCrore } from "../lib/money";

export function WbPolicePage() {
  const hero = pickAmount(wbFunctional, "2026-27", "be");
  const run = pickAmount(wb2055Net, "2026-27", "be");
  const cap = pickAmount(wb4055, "2026-27", "be");
  const gross = pickAmount(wb2055Gross, "2026-27", "be");
  const sal = pickAmount(wbSalariesDesk, "2026-27", "be");
  const arms = pickAmount(wbArms, "2026-27", "be");
  const cloth = pickAmount(wbClothing, "2026-27", "be");
  if (!hero || !run || !cap || !gross || !sal || !arms || !cloth) {
    throw new Error("Missing WB gold figures");
  }

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        West Bengal Police
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not the
        whole Home department. Kolkata pay sits inside the statewide salaries line.
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
      <HeadSplit run={run} cap={cap} />
      <p className="mt-3 text-sm text-ink/70">
        Running costs before recoveries: <Money money={gross} size="row" />
      </p>
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Salaries, arms, clothing</h2>
        <dl className="mt-4 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Salaries</dt>
            <dd>
              <Money money={sal} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Arms</dt>
            <dd>
              <Money money={arms} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Clothing</dt>
            <dd>
              <Money money={cloth} size="row" />
            </dd>
          </div>
        </dl>
        <RankedHatch
          compact
          showAll
          items={[wbSalariesDesk, wbArms, wbClothing]}
          fiscalYear="2026-27"
          series="be"
          shareOf={run}
          title="Typed lines inside running costs"
          note="Share of running costs. Salaries are added from printed pay lines. The rest of running costs is not fully typed."
        />
      </section>
      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "West Bengal state budget, Home, 2026-27" },
          { id: "major", label: "Police", money: hero },
          { id: "run", label: "Running costs", money: run },
          { id: "cap", label: "Buildings and gear", money: cap },
          { id: "object", label: "Salaries", money: sal },
          {
            id: "station",
            label: "Named police station",
            empty: "Kolkata pay sits inside statewide salaries. The book does not print a station allotment.",
          },
        ]}
      />
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
