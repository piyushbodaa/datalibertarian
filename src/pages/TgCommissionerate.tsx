import { Link, Navigate, useParams } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { SERIES_LABEL } from "../lib/money";
import { cpHero, getCommissionerate } from "../data/telangana/commissionerates";

export function TgCommissioneratePage() {
  const { cp } = useParams();
  const unit = cp ? getCommissionerate(cp) : undefined;
  if (!unit) return <Navigate to="/telangana/commissionerates" replace />;

  const hero = cpHero(unit);

  return (
    <article>
      <p className="kicker">GOLD · Law+Home · HoD</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{unit.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        {unit.hod}. Combined <strong>establishment + schemes</strong> as printed under major head{" "}
        {unit.majorHead}. This is a commissionerate HoD total — not statewide Police object 010,
        not Demand X Home, and not a police-station allotment.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">
          Combined HoD · {SERIES_LABEL[hero.series]} FY {hero.fiscalYear}
        </p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>

      <ol className="mt-8 max-w-xl space-y-3">
        {unit.combined.amounts.map((m) => (
          <li key={`${m.fiscalYear}-${m.series}`} className="flex justify-between gap-4 text-sm">
            <span>
              {SERIES_LABEL[m.series]} {m.fiscalYear}
            </span>
            <Money money={m} size="row" />
          </li>
        ))}
      </ol>

      {unit.missingYears.map((gap) => (
        <section key={gap.fiscalYear} className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Year not in the book</p>
          <h2 className="mt-2 font-display text-xl font-semibold">FY {gap.fiscalYear} is not printed</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">{gap.reason}</p>
          <div className="mt-6 border border-dashed border-ink/25 px-3 py-6 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
            No hatch · no guessed rupee
          </div>
        </section>
      ))}

      <p className="mt-8">
        <Link to={`/telangana/${unit.slug}/stations`} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Police stations — not in the Demand books
        </Link>
      </p>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={unit.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/telangana/commissionerates">All commissionerates</Link>
          {" · "}
          <Link to="/telangana/police">Telangana Police (statewide object 010)</Link>
          {" · "}
          <Link to="/sources">Sources</Link>
        </p>
      </section>
    </article>
  );
}
