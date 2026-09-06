import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { pickAmount } from "../data/maharashtra-police";
import { TraceRail } from "../components/TraceRail";
import { RankedHatch } from "../components/RankedHatch";
import { up2055Voted, up4055, upFunctional, upSalariesDesk, upUniforms } from "../data/uttar-pradesh/police";
import { formatCrore } from "../lib/money";

export function UpPolicePage() {
  const hero = pickAmount(upFunctional, "2026-27", "be");
  const run = pickAmount(up2055Voted, "2026-27", "be");
  const cap = pickAmount(up4055, "2026-27", "be");
  const sal = pickAmount(upSalariesDesk, "2026-27", "be");
  const uni = pickAmount(upUniforms, "2026-27", "be");
  if (!hero || !run || !cap || !sal || !uni) throw new Error("Missing UP gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Uttar Pradesh Police
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        What the state budget set aside to run the police and to build or buy for them. Not the
        whole Home department.
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
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Salaries and uniforms</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Salaries here are added from printed pay lines — smaller than running costs. A named
          arms line was not found in this book.
        </p>
        <dl className="mt-4 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Salaries</dt>
            <dd>
              <Money money={sal} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Uniforms</dt>
            <dd>
              <Money money={uni} size="row" />
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink/65">
          Arms: not found
          <CitationChip citationId={hero.citationId} />
        </p>
        <RankedHatch
          compact
          items={[upSalariesDesk]}
          fiscalYear="2026-27"
          series="be"
          shareOf={run}
          title="Salaries as a share of running costs"
          note="Added from printed pay lines. The rest of running costs is other objects not fully typed."
        />
      </section>
      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Uttar Pradesh state budget, Home, 2026-27" },
          { id: "major", label: "Police", money: hero },
          { id: "run", label: "Running costs", money: run },
          { id: "cap", label: "Buildings and gear", money: cap },
          { id: "object", label: "Salaries", money: sal, detail: "Added from printed pay lines — not the whole running-cost total." },
          {
            id: "station",
            label: "Named police station",
            empty: "The book stops at pay lines. We do not divide that total by the number of stations.",
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
