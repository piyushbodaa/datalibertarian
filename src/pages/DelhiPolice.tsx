import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { SERIES_LABEL } from "../lib/money";
import { delhiEstInfra } from "../data/union/delhi-police";

export function DelhiPolicePage() {
  const hero = delhiEstInfra.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
  if (!hero) throw new Error("Missing Delhi est+infra");

  return (
    <article>
      <p className="kicker">Union books → Demand 51 → Delhi Police</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Delhi Police (Union)
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Establishment (Demand 51 item 5) plus Police Infrastructure earmarked Delhi Police (item
        14.02). Not GNCTD AFS. Not the Demand 51 net total. Not a state INDEX row.
      </p>
      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Establishment + infrastructure · FY 2026-27 budget</p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>
      <ol className="mt-8 max-w-xl space-y-3">
        {delhiEstInfra.amounts.map((m) => (
          <li key={`${m.fiscalYear}-${m.series}`} className="flex justify-between gap-4 text-sm">
            <span>
              {SERIES_LABEL[m.series]} {m.fiscalYear}
            </span>
            <Money money={m} size="row" />
          </li>
        ))}
      </ol>
      <p className="mt-8">
        <Link to="/union/police" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Demand 51 net ledger
        </Link>
      </p>
      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {[...new Set(delhiEstInfra.amounts.map((a) => a.citationId))].map((id) => (
            <CitationFootnote key={id} citationId={id} />
          ))}
        </ol>
      </section>
    </article>
  );
}
